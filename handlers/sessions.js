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
      var creds = {uuid: undefined, password: body.password};
      if (body.usernameOrEmail.indexOf('@') < 0) { // username was entered
        // Get uuid from username
        self.accountsIndexes.getKeyFromUsername(body.usernameOrEmail, function (err, account) {
          if (err || !account) return console.log("Sessions.createSession: error retrieving " +
            "account from username, err:", err);
          creds.uuid = account.key;
          return self.verifyCredentials(res, creds);
        });
      } else { // email was entered
        // Get uuid from email
        self.accountsIndexes.getKeyFromEmail(body.usernameOrEmail, function (err, account) {
          if (err || !account) return console.log("Sessions.createSession: error retrieving " +
          "account from email, err:", err);
          creds.uuid = account.key;
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
