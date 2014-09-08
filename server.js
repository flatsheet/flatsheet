var fs = require('fs');
var url = require('url');
var http = require('http');
var st = require('st');
var Router = require('routes-router');
var response = require('response');
var Handlebars = require('handlebars');
var hbsLayouts = require('handlebars-layouts')(Handlebars);
var level = require('level');
var accountdown = require('accountdown');
var sublevel = require('level-sublevel');
var levelSession   = require('level-session');
var socketio = require('socket.io');
var getView = require('./util/get-view')(Handlebars);
var Sheets = require('./sheets');

module.exports = Server;


/*
* Register the layout view as the a handlebars layout so it can be used by partial views
*/

Handlebars.registerPartial('layout', fs.readFileSync('views/layout.html', 'utf8'));


/*
*
*/

function Server (opts) {
  if (!(this instanceof Server)) return new Server(opts);
  opts || (opts = {});


  /*
  * Set path for static files
  */

  this.staticFiles = opts.staticFiles || __dirname + '/public';

  /*
  * Create leveldb using level-sublevel
  */

  this.db = level(opts.db || './data/db');


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
  * Set up the application's views using the getView() helper
  */

  this.views = {
    account: getView('account'),
    dashboard: getView('dashboard'),
    index: getView('index'),
    sheet: getView('sheet'),
    sheetlist: getView('sheet-list'),
    signin: getView('signin')
  };

  this.createServer();
}


/*
*
*/

Server.prototype.createServer = function () {
  var self = this;



  this.router = Router();

  /*
  *  Static file server
  */

  var staticFiles = st({ path: this.staticFiles, url: '/public/' });


  /*
  *  Set up server with sessions, path matching for router, and static files
  */

  this.server = http.createServer(function (req, res) {
    if (staticFiles(req, res)) return;

    self.session(req, res, function () {
      self.router(req, res);
    });
  });
}


/*
*
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
      res.account = account;
      cb.call(self, req, res, opts);
    });
  });
}



Server.prototype.render = function (view, ctx) {
  return this.views[view](ctx);
}
