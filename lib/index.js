var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var st = require('st');
var mkdirp = require('mkdirp');
var response = require('response');
var socketio = require('socket.io');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var filter = require('filter-object');
var extend = require('extend');
var dotenv = require('dotenv');
var cors = require('corsify');

var Handlebars = require('handlebars');
require('handlebars-layouts')(Handlebars);
require('./handlebars-helpers')(Handlebars);

var initdb = require('./db');

module.exports = Server;

/*
* Main server constructor function
*/

function Server (opts, cb) {
  if (!(this instanceof Server)) return new Server(opts, cb);

  opts = extend({ 
    site: { 
      title: 'flatsheet',
      email: 'hi@flatsheet.io',
      url: 'http://127.0.0.1',
      contact: 'flatsheet admin' 
    }
  }, opts)

  var self = this;
  this.site = opts.site;

  var envFilePath = path.join((opts.dir || process.cwd()), '.env');

  if (fs.existsSync(envFilePath)) {
    var envFile = fs.readFileSync(envFilePath);
    var secrets = dotenv.parse(envFile);
  } else {
    var secrets = {
      SENDGRID_USER: process.env.SENDGRID_USER,
      SENDGRID_PASS: process.env.SENDGRID_PASS
    }
  }

  /*
  * Set path for static files
  */

  this.staticFiles = opts.staticFiles || path.join(__dirname, '..', 'public');
  this.staticFileUrl = opts.staticFileUrl || '/public/'

  mkdirp(this.staticFiles, function (err) {
    if (err) console.error(err)
  });

  /*
  * Set path for db
  */

  this.dataDir = opts.dataDir || opts.db || path.join(__dirname, '..', 'data');

  mkdirp(this.dataDir, function (err) {
    if (err) console.error(err);
    else initdb(self, cb);
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

}

/*
*  Get an account based on the session
*/
Server.prototype.getAccountBySession = function (req, cb) {
  var self = this;

  this.auth.getSession(req, function (sessionError, session) {
    if (sessionError) return cb(sessionError);
    
    self.accountdown.get(session.data.username, function (accountError, account) {
      if (accountError) return cb(accountError);
      if (!account) return cb(null, null, session);
      
      var accountFiltered = filter(account, '!email');
      return cb(null, accountFiltered, session);
    });
  });
}


/*
*  listen method for starting the server
*/
Server.prototype.listen = function (port, cb) {
  if (typeof port === 'function') {
    cb = port;
    port = null;
  }

  this.port = port || (process.env.NODE_ENV === 'production' ? 80 : 3333);
  var self = this;

  var cb = cb || function () {
    console.log('flatsheet server listening at ' + self.site.url);
  }

  var staticFiles = st({ path: this.staticFiles, url: this.staticFileUrl });
  var landing = require('../routes/landing')(this);
  var sessions = require('../routes/sessions')(this);
  var accounts = require('../routes/accounts')(this);
  var accountsAPIv20 = require('../routes/accounts-api-v2-0')(this);
  var sheets = require('../routes/sheets')(this);
  var sheetsAPIv20 = require('../routes/sheets-api-v2-0')(this);

  function handler (req, res) {
    if (staticFiles(req, res)) return;
    if (landing.match(req, res)) return;
    if (sessions.match(req, res)) return;
    if (accounts.match(req, res)) return;
    if (accountsAPIv20.match(req, res)) return;
    if (sheets.match(req, res)) return;
    if (sheetsAPIv20.match(req, res)) return;

    self.getAccountBySession(req, function (err, account, session) {
      response().html(self.render('404', { account: account })).pipe(res);
    });
  }

  var opts = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization'
  };

  this._server = http.createServer(cors(opts, handler));
  var io = socketio(this._server);
  require('./realtime-editing')(io, this);
  this._server.listen(this.port, cb);
};


/*
*  listen method for stopping the server
*/
Server.prototype.close = function () {
  this._server.close();
  this.db.close();
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
