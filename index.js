var fs = require('fs');
var url = require('url');
var http = require('http');
var st = require('st');
var Router = require('routes-router');
var response = require('response');
var Handlebars = require('handlebars');
var hbsLayouts = require('handlebars-layouts')(Handlebars);
var level = require('level-party');
var accountdown = require('accountdown');
var sublevel = require('level-sublevel');
var levelSession   = require('level-session');
var socketio = require('socket.io');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var extend = require('extend');
var dotenv = require('dotenv');
var corsify = require('corsify');

var getView = require('./util/get-view')(Handlebars);
var Sheets = require('./models/sheets');

var apiV2 = require('./routes/api-v2');
var sheets = require('./routes/sheets');
var accounts = require('./routes/accounts');
var sessions = require('./routes/sessions');


module.exports = Server;


/*
* Register the layout view as the a handlebars layout
* so it can be used by partial views
*/

Handlebars.registerPartial('layout', fs.readFileSync(__dirname + '/views/layout.html', 'utf8'));


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
* Main server constructor function
*/

function Server (opts) {
  if (!(this instanceof Server)) return new Server(opts);
  opts || (opts = {});
  
  var envFile = fs.readFileSync((opts.dir || process.cwd()) + '/.env');
  var secrets = dotenv.parse(envFile);

  this.site = opts.site;

  /*
  * Set path for static files
  */

  this.staticFiles = opts.staticFiles || __dirname + '/public';

  /*
  * Create leveldb using level-sublevel
  */

  this.db = level(opts.db || __dirname + '/data/db');


  /*
  * Create sublevel for sheets
  */

  this.sheets = Sheets(sublevel(this.db).sublevel('sheets', {
    valueEncoding: 'json'
  }));


  /*
  * Create sublevel for sessions using level-session
  */

  this.session = levelSession({
    db: sublevel(this.db).sublevel('sessions')
  });


  /*
  * Set up accountdown with accountdown-basic for account management
  */

  this.accounts = accountdown(this.db, {
    login: { basic: require('accountdown-basic') },
    keyEncoding: 'buffer',
    valueEncoding: 'json'
  });


  /*
  * Invites sublevel
  */

  this.invites = sublevel(this.db).sublevel('invites', {
    valueEncoding: 'json'
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

  this.views = {};
  this.viewsDir = opts.viewsDir || __dirname + '/views/';
  this.createViews();

  this.viewData = {
    site: this.site
  };
  
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


  /*
  * Set up the routes of the app
  */

  if (opts.defaultRoutes !== false) {
    apiV2.install(this);
    sheets.install(this);
    accounts.install(this);
    sessions.install(this);
  }
}


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
    
    self.session(req, res, function () {
      self.router(req, res);
    });
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
}


/*
*  listen method for starting the server
*/

Server.prototype.listen = function (port, cb) {
  this.server.listen(port, cb);
}


/*
*  Add a route to the server
*/

Server.prototype.route = function (path, cb) {
  var self = this;

  this.router.addRoute(path, function (req, res, opts) {
    req.session.get(req.session.id, function (err, account) {
      self.viewData.account = res.account = account;
      cb.call(self, req, res, opts);
    });
  });
}


/*
* Create views on application startup
*/

Server.prototype.createViews = function () {
  var self = this;

  fs.readdir(this.viewsDir, function (err, files) {
    files.forEach(function (file) {
      self.addView(file);
    });
  });
}


/*
* Add a view to the list of views
*/

Server.prototype.addView = function (file, viewsDir) {
  var dir = viewsDir || this.viewsDir;
  this.views[file.split('.')[0]] = getView(dir + file);
}


/*
* Method for rendering html views
*/

Server.prototype.render = function (view, ctx) {
  var data = extend(this.viewData, (ctx || {}));
  return this.views[view](data);
}
