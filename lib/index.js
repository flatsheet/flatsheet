var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var st = require('st');
var mkdirp = require('mkdirp');
var Router = require('routes-router');
var response = require('response');
var Handlebars = require('handlebars');
var hbsLayouts = require('handlebars-layouts')(Handlebars);
var level = require('level');
var accountdown = require('accountdown');
var cookieAuth = require('cookie-auth');
var sublevel = require('subleveldown');
var socketio = require('socket.io');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var extend = require('extend');
var dotenv = require('dotenv');
var corsify = require('corsify');
var anyBody = require('body/any');

var getView = require('./get-view')(Handlebars);
//var redirect = require('./redirect');
var Accounts = require('../models/accounts');
var AccountsApiHandler = require('../models/accountsApiHandler');
var Sheets = require('../models/sheets');
var Permissions = require('./permissions');

var apiV2 = require('../routes/api-v2');
var sheets = require('../routes/sheets');
var accounts = require('../routes/accounts');
var sessions = require('../routes/sessions');


module.exports = Server;


/*
* Register the layout view as the a handlebars layout
* so it can be used by partial views
*/

Handlebars.registerPartial('layout', fs.readFileSync(__dirname + '/../views/layout.html', 'utf8'));


/*
*
*/

Handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context);
});


/*
* Increment variable
*/

Handlebars.registerHelper('plus1', function(value, options) {
  return parseInt(value) + 1;
});

/*
* Fill in checkbox
*/

Handlebars.registerHelper('checked', function (currentValue) {
  return currentValue == true ? ' checked ' : '';
});

/*
* Main server constructor function
*/

function Server (opts, cb) {
  if (!(this instanceof Server)) return new Server(opts, cb);

  opts || (opts = {});
  var self = this;
  
  this.site = opts.site || { 
    title: 'flatsheet',
    email: 'hi@flatsheet.io',
    url: 'http://127.0.0.1',
    contact: 'flatsheet admin' 
  };
  
  var envFilePath = (opts.dir || process.cwd()) + '/.env';

  if (fs.existsSync(envFilePath)) {
    var envFile = fs.readFileSync(envFilePath);
    var secrets = dotenv.parse(envFile);
  }
  else {
    var secrets = {
      SENDGRID_USER: process.env.SENDGRID_USER,
      SENDGRID_PASS: process.env.SENDGRID_PASS
    }
  }

  /*
  * Set path for static files
  */

  this.staticFiles = opts.staticFiles || __dirname + '/../public';

  mkdirp(this.staticFiles, function (err) {
    if (err) console.error(err)
  });

  /*
  * Set path for db
  */

  this.dataDir = opts.dataDir || opts.db || path.join(__dirname, '/../data');

  mkdirp(this.dataDir, function (err) {
    if (err) console.error(err);
    else {
      self.createDB(cb);
      /*
       * Set up the routes of the app
       */
      if (opts.defaultRoutes !== false) {
        apiV2.install(self);
        accounts.install(self);
        sheets.install(self);
        sessions.install(self);
      }
    }
  });

  /*
  * Email
  */

  var options = {
    auth: {
      api_user: secrets.SENDGRID_USER,
      api_key: secrets.SENDGRID_PASS
    }
  };

  this.email = nodemailer.createTransport(sgTransport(options));

  /*
  * Set up the application's views
  */

  this.views = {}
  this.viewsDir = path.join(__dirname, '/../views/');
  this.viewData = { site: opts.site };
  this.addViews();

  if (opts.views) {
    if (opts.views[opts.views.length - 1] !== '/')  opts.views += '/';
    this.viewsOverrideDir = opts.views;
    this.overrideViews();
  }
  
  opts.cors || (opts.cors = {});
  
  this.cors = corsify({
    'Access-Control-Allow-Origin': opts.cors['Access-Control-Allow-Origin'] || '*',
    'Access-Control-Allow-Methods': opts.cors['Access-Control-Allow-Methods'] || 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': opts.cors['Access-Control-Allow-Headers'] || 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization'
  });


  /*
  *  Create the http server
  */

  this.createServer();

}

/*
*  Method for creating db levels
*/

Server.prototype.createDB = function (cb) {
  var self = this;

  /*
  * Create leveldb using level
  */

  this.db = level(path.join(this.dataDir, 'db'));


  /*
  * Create sublevel for sheets
  */
  
  this.sheets = Sheets(sublevel(this.db, 'sheets', {
    valueEncoding: 'json'
  }));
  
  
  /*
  * Create sublevel for sessions using cookie-auth
  */
  
  this.auth = cookieAuth({
    name: self.site.title, 
    sessions: sublevel(this.db, 'sessions'),
    authenticator: function (req, res, cb) {
      anyBody(req, res, function (err, body) {
        self.accountdown.verify('basic', body, function (err, ok, id) {
          if (err) return cb(err);
          if (!ok) return cb(new Error('incorrect password or username'));
          else cb();
        });
      });
    }
  });

  
  /*
  * Set up accountdown with accountdown-basic for account management
  */

  this.accountdown = accountdown(sublevel(this.db, 'accounts'), {
    login: { basic: require('accountdown-basic') },
    keyEncoding: 'buffer',
    valueEncoding: 'json'
  });
  this.accounts = Accounts(this);
  this.accountsApiHandler = AccountsApiHandler(this);
  this.permissions = Permissions(this);

  /*
  * Invites sublevel
  */

  this.invites = sublevel(this.db, 'invites', {
    valueEncoding: 'json'
  });

  if (cb) cb();
};


/*
*  Method for creating http server
*/

Server.prototype.createServer = function () {
  var self = this;


  /*
  *  Create router
  */

  this.router = Router();

  /*
  *  Static file server
  */

  var staticFiles = st({ path: this.staticFiles, url: '/public/' });


  /*
  *  Set up server with sessions, path matching for router, and static files
  */

  this.server = http.createServer(self.cors(function (req, res) {
    if (staticFiles(req, res)) return;
    self.router(req, res);
  }));

  var io = socketio(this.server);
  var rooms = {};

  io.on('connection', function (socket) {
    socket.on('room', function (room) {
      socket.join(room);

      if (!rooms[room]) rooms[room] = { users: {} };

      socket.on('user', function (user) {
        if (!rooms[room].users[socket.id]) {
          rooms[room].users[socket.id] = user;
        }
        io.to(room).emit('update-users', rooms[room].users);
      });

      self.sheets.fetch(room, function (err, sheet) {
        socket.on('change', function (change, rows, sort) {          
          sheet.rows = rows;
          self.sheets.update(room, sheet, function (err) {
            if (err) console.error(err);
            socket.broadcast.to(room).emit('change', change, rows, sort);
          });
        });
        
        socket.on('sheet-details', function (change) {
          sheet = extend(sheet, change);
          
          self.sheets.update(room, sheet, function (err) {
            if (err) console.error(err);
            socket.broadcast.to(room).emit('sheet-details', change);
          });
        });

        socket.on('cell-focus', function (cell, color) {
          io.to(room).emit('cell-focus', cell, color);
        });

        socket.on('cell-blur', function (cell) {
          io.to(room).emit('cell-blur', cell);
        });
      });

      socket.on('disconnect', function () {
        io.to(room).emit('cell-blur');
        delete rooms[room].users[socket.id];
        io.to(room).emit('update-users', rooms[room].users);
      });
    });
  });
};

Server.prototype.getUserBySession = function (req, cb) {
  var self = this;

  this.auth.getSession(req, function (sessionError, session) {
    if (sessionError) return cb(sessionError);
    self.accountdown.get(session.data.username, function (userError, user) {
      if (userError) return cb(userError);
      cb(null, { username: user.username, admin: user.admin, active: true }, session);
    });
  });
};

/*
*  listen method for starting the server
*/

Server.prototype.listen = function (port, cb) {
  this.server.listen(port, cb);
};


/*
*  listen method for stopping the server
*/

Server.prototype.close = function () {
  this.server.close();
  this.db.close();
};


/*
*  Add a route to the server
*/

Server.prototype.route = function (path, cb) {
  var self = this;

  this.router.addRoute(path, function (req, res, opts) {
    self.getUserBySession(req, function (err, account) {
      self.viewData.account = res.account = account;
      cb.call(self, req, res, opts);
    });
  });
};


/*
* Create views on application startup
*/

Server.prototype.addViews = function () {
  var self = this;
  
  fs.readdir(this.viewsDir, function (err, files) {
    files.forEach(function (file) {
      if (file === 'layout.html') {
        var filepath = self.viewsDir + 'layout.html';
        Handlebars.registerPartial('layout', fs.readFileSync(filepath, 'utf8'));
      }
      else self.addView(file);
    });
  });
}


/*
* Add a view to the list of views
*/

Server.prototype.addView = function (file, viewsDir) {
  var dir = viewsDir || this.viewsDir;
  return this.views[file.split('.')[0]] = this.compileView(dir + file);
}


/*
* compile a view
*/

Server.prototype.compileView = function (filepath) {
  var template = Handlebars.compile(fs.readFileSync(filepath, 'utf8'));
  return template;
}


/*
* Override views
*/

Server.prototype.overrideViews = function () {
  var self = this;

  fs.readdir(this.viewsOverrideDir, function (err, files) {
    files.forEach(function (file) {
      if (file === 'layout.html') {
        var filepath = self.viewsOverrideDir + 'layout.html';
        Handlebars.registerPartial('layout', fs.readFileSync(filepath, 'utf8'));
      }
      else self.addView(file, self.viewsOverrideDir);
    });
  });
};


/*
* Method for rendering html views
*/

Server.prototype.render = function (view, data) {
  var data = extend(data || {}, this.viewData);
  return this.views[view](data);
};
