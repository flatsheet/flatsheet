var extend = require('extend');
var response = require('response');
var JSONStream = require('JSONStream');
var jsonBody = require('body/json');
var through = require('through2');
var filter = require('filter-object');

module.exports = AccountsApiHandler;

function AccountsApiHandler (server) {
  if (!(this instanceof AccountsApiHandler)) {
    return new AccountsApiHandler(server);
  }
  this.server = server;
}

/*
 * GET: return all accounts
 * POST: create a new account
 */
AccountsApiHandler.prototype.accounts = function (req, res) {
  var self = this;
  this.server.authorizeAPI(req, res, function (authError, authAccount, session) {
    var notAuthorized = (authError || !authAccount);
    if (req.method === 'GET') {
      // Get all accounts
      if (notAuthorized) {
        return self.server.accountdown.list({keys: false})
          .pipe(filterAccountDetails())
          .pipe(JSONStream.stringify())
          .pipe(res);
        }
      return self.server.accountdown.list()
        .pipe(JSONStream.stringify())
        .pipe(res);
    }
    else if (req.method === 'POST') {
      if (notAuthorized) return response().status('401').json({error: 'Not Authorized'}).pipe(res);
      // create a new account
      jsonBody(req, res, function (err, body) {
        if (err) return response().status(500).json({ error: err }).pipe(res);
        var opts = {
          login: { basic: { username: body.username, password: body.password } },
          value: filter(body, '!password')
        };

        self.server.accountdown.create(body.username, opts, function (err) {
          if (err) return response().status(500).json({ error: 'Unable to create new user' }).pipe(res);

          self.server.accountdown.get(body.username, function (err, account) {
            if (err) return response().status(500).json({ error: 'Server error' }).pipe(res);

            response().json(account).pipe(res)
          })
        })
      });
    }
  });
};

/*
 * GET: return an account
 * PUT: update an account
 * DELETE: remove an account
 */
AccountsApiHandler.prototype.accountFromUsername = function (req, res, opts) {
  debugger;
  var self = this;
  this.server.authorizeAPI(req, res, function (authError, authAccount, session) {
    var notAuthorized = (authError || !authAccount);
    if (req.method === 'GET') {
      self.server.accountdown.get(opts.params.username, function (err, account) {
        if (err) return response().status('500').json({error: 'Could not retrieve the account'}).pipe(res);
        if (notAuthorized) {
          account = filter(account, ['*', '!email', '!admin']);
        }
        return response().json(account).pipe(res)
      });
    }
    if (req.method === 'PUT') {
      if (notAuthorized) return response().status('401').json({error: 'Not Authorized'}).pipe(res);
      jsonBody(req, res, opts, function (err, body) {
        if (err) return response().status(500).json({ error:'Could not parse the request\'s body' }).pipe(res);
        self.server.accountdown.get(opts.params.username, function (err, account){
          if (err) return response().status(500).json({ error:'Username does not exist' }).pipe(res);
          account = extend(account, body);
          self.server.accountdown.put(opts.params.username, account, function (err) {
            if (err) return response().status(500).json({ error:'Server error' }).pipe(res);
            response().json(account).pipe(res);
          });
        });
      });
    }
    if (req.method === 'DELETE') {
      if (notAuthorized) return response().status('401').json({ error: 'Not Authorized'}).pipe(res);
      self.server.accountdown.remove(opts.params.username, function (err, account) {
        if (err) return response().status(500).json({ error:'Username does not exist' }).pipe(res);
        return response().json(account).pipe(res);
      })
    }
  });
};

/*
 * Helper functions
 */

function filterAccountDetails () {
  return through.obj(function iterator(chunk, enc, next) {
    this.push(filter(chunk, ['*', '!email', '!admin']));
    next();
  });
}
