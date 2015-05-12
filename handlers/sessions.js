var formBody = require('body/form');
var redirect = require('../lib/redirect');

module.exports = Sessions;

function Sessions (server) {
  if (!(this instanceof Sessions)) {
    return new Sessions(server);
  }
  this.auth = server.auth;
  this.accountsIndexes = server.accountsIndexes;
  this.accountdown = server.accountdown;
}

Sessions.prototype.createSession = function (req, res) {
  var self = this;
  if (req.method === 'POST') {
    formBody(req, res, function (err, body) {
      body.usernameOrEmail = body.usernameOrEmail.trim();
      // Check whether the provided credential is username or email,
      // then verify it by logging in
      var creds = {username: undefined, password: body.password};
      if (body.usernameOrEmail.indexOf('@') < 0) {
        creds.username = body.usernameOrEmail;
        return self.verifyCredentials(res, creds);
      } else { // email was entered
        self.accountsIndexes.getKeyFromEmail(body.usernameOrEmail, function (err, account) {
          if (err || !account) return console.log("Sessions.createSession: error retrieving " +
          "account from key, err:", key);
          creds.username = account.username;
          return self.verifyCredentials(res, creds);
        });
      }
    });
  }
  if (req.method === 'GET') {
    redirect(res, '/');
  }
}

Sessions.prototype.destroySession = function (req, res) {
  var self = this;
  this.auth.delete(req, function () {
    self.auth.cookie.destroy(res);
    redirect(res, '/');
  });
}


Sessions.prototype.verifyCredentials = function (res, creds) {
  var self = this;
  this.accountdown.verify('basic', creds, function (err, ok, id) {
    if (err) {
      console.error(err);
    } else if (!ok) {
      // TODO: notify user about incorrect password, and offer reset password option (issue #47)
    } else {
      self.auth.login(res, {key: id}, function (loginerr, data) {
        if (loginerr) console.error(loginerr);
      });
    }
    return redirect(res, '/');
  });
}
