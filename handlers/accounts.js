var uuid = require('uuid').v1;
var extend = require('extend');
var response = require('response');
var formBody = require('body/form');
var qs = require('querystring');
var url = require('url');
var randomColor = require('random-color');
var redirect = require('../lib/redirect');

module.exports = Accounts;

function Accounts (server) {
  if (!(this instanceof Accounts)) {
    return new Accounts(server);
  }
  this.server = server;
  this.permissions = require('../lib/permissions')(server);
}

/*
 * Route callbacks
 */
Accounts.prototype.getListOfAccounts = function (req, res) {
  var self = this;
  this.permissions.authorizeSession(req, res, function (error, account, session) {
    if (!account.admin || error) return redirect(res, '/');

    if (req.method === 'GET') {
      var results = [];
      var stream = self.server.accountdown.list();

      stream
        .on('data', function (data) {
          results.push(data);
        })
        .on('error', function (err) {
          return console.log(err);
        })
        .on('end', function () {
          var ctx = { accounts: results, account: account };
          return response().html(self.server.render('account-list', ctx)).pipe(res);
        });
    }
  });
};

Accounts.prototype.signIntoAccount = function (req, res) {
  if (req.method === 'GET') {
    this.server.getAccountBySession(req, function (err, account, session) {
      if (err || !account) return console.log("signing in: retrieving account from session failed:", err);
      if (account) {
        res.writeHead(302, { 'Location': '/' });
        return res.end();
      }
      else return response().html(this.server.render('signin')).pipe(res);
    });
  }
};

Accounts.prototype.createAccountAsAdmin = function (req, res) {
  var self = this;
  this.permissions.authorizeSession(req, res, function (error, account, session) {
    if (!account.admin || error) {
      if (error) console.log(error);
      res.writeHead(302, { 'Location': self.prefix });
      return res.end();
    }
    if (req.method === 'GET') {
      return response()
        .html(self.server.render('account-new', { account: account }))
        .pipe(res);
    }
    if (req.method === 'POST') {
      self.createAccountFromForm(req, res);

      res.writeHead(302, {'Location' : self.prefix});
      return res.end();
    }
  });
};

Accounts.prototype.createAccount = function (req, res) {
  var self = this;
  if (req.method === 'GET') {
    this.server.getAccountBySession(req, function (err, account, session) {
      if (error) return console.log(error);
      return response()
        .html(self.server.render('account-new'))
        .pipe(res);
    });
    
  }

  if (req.method === 'POST') {
    this.createAccountFromForm(req, res);
    res.writeHead(302, { 'Location': '/' });
    return res.end();
  }
};

Accounts.prototype.deleteAccount = function (req, res, opts) {
  var self = this;
  this.permissions.authorizeSession(req, res, function (error, user, session) {
    if (user.admin && !error) {
      if (req.method === 'POST') {
        // TODO: Remove account username from all sheet permissions
        self.server.accountdown.remove(opts.params.uuid, logIfError);
        res.writeHead(302, { 'Location': self.prefix });
        return res.end();
      }
    } else {
      if (error) {
        console.log(error);
      }
      res.writeHead(302, { 'Location': '/' });
      return res.end();
    }
  });
};

Accounts.prototype.updateAccount = function (req, res, opts) {
  var self = this;
  this.permissions.authorizeSession(req, res, function (error, account, session) {
    if (error) redirect(res, '/');
    if (req.method === 'POST') {
      // check if we are updating the current account as a non-admin:
      if (account.uuid !== opts.params.uuid && !account.admin) {
        // TODO: Flash notification (?)
        console.log("WARNING: You must be admin to update an account which is not yours");
        res.writeHead(302, {'Location': self.prefix });
        return res.end();
      }
      self.updateAccountFromForm(req, res, opts.params.uuid, function () {
        res.writeHead(302, {'Location': self.prefix });
        return res.end();
      });
    }
    if (req.method === 'GET') {
      self.renderAccountUpdateForm(res, opts.params.uuid, account);
    }
  });
};

Accounts.prototype.passwordReset = function (req, res, opts) {
  var self = this;
  if (req.method === 'GET') {

    this.server.getAccountBySession(req, function (err, account, session) {
      if (account) {
        return response()
          .html(self.server.render('password-reset', {account: account}))
          .pipe(res);
      }
    });
  } else if (req.method === 'POST') {
    this.permissions.authorizeSession(req, res, function (error, account, session) {
      if (error) return console.error("error authorizing session:", error);
      if (account) {
        self.updateAccountFromForm(req, res, opts.params.uuid, function (err) {
          if (err) return console.log(err);

          if (!account) return console.log("No account returned after updating");
          // delete then recreate the session token since the login account has been recreated
          // when the password was updated
          self.server.auth.delete(req, function () {
            self.server.auth.cookie.destroy(res);
            self.server.auth.login(res, {uuid: account.uuid }, function (loginerr, data) {
              if (loginerr) return console.log(loginerr);
              res.writeHead(302, {'Location': '/'});
              return res.end();
            });
          });

        });
      } else {
        return response().html(self.server.render('signin')).pipe(res);
      }
    });
  }
}

Accounts.prototype.passwordResetAccept = function (req, res, opts) {
  var self = this;
  if (req.method === 'GET') {

    var query = url.parse(req.url).query;
    var token = qs.parse(query).token;
    var uuid = qs.parse(query).uuid;
    var username = qs.parse(query).username;
    this.server.resets.get(token, function (err, resetReq) {
      if (err || resetReq.accepted) {
        res.writeHead(302, { 'Location': '/' });
        return res.end();
      }
      else {
        self.server.auth.login(res, { uuid: uuid }, function (loginerr, data) {

          if (loginerr) return console.error("login error:", loginerr);
          resetReq.accepted = true;
          self.server.resets.put(token, resetReq);
          var account = {email: resetReq.email, uuid: uuid, username: username};
          return response()
            .html(self.server.render('password-reset', {account: account}))
            .pipe(res);
        });
      }
    });
  }
}

Accounts.prototype.invite = function (req, res) {
  var self = this;
  
  this.server.getAccountBySession(req, function (err, account, session) {
    if (account && account.admin) {
      if (req.method === 'GET') {
        return response()
          .html(self.server.render('invite', { account: account }))
          .pipe(res);
      }

      if (req.method === 'POST') {
        // Shouldn't we authorize the account session token here???
        formBody(req, res, function (err, body) {
          //todo: notification of error on page
          if (err) console.error(err);

          var emails = body.emails.split('\r\n');

          emails.forEach(function (email) {
            var token = uuid();
            var opts = { email: email, accepted: false };
            self.server.invites.put(token, opts, function (err) {
              if (err) console.log(new Error(err));
              
              var data = {
                url: self.server.site.url + '/accounts/accept?token=' + token,
                from: self.server.site.email,
                fromname: self.server.site.contact
              };

              var message = { // Should these be from the current account, or Flatsheet server?
                to: email,
                from: self.server.site.email,
                fromname: self.server.site.contact,
                subject: 'Help me curate data with Flatsheet',
                text: self.server.render('invite-email', data),
                html: self.server.render('invite-email', data)
              };

              self.server.email.sendMail(message, function(err, info){
                if (err) return console.log(err);
                return response()
                  .html(self.server.render('invite', { emails: emails }))
                  .pipe(res);
              });
            });
          });
        });
      }
    }
    else {
      res.writeHead(302, { 'Location': '/' });
      return res.end();
    }
  });
};

Accounts.prototype.acceptInvite = function (req, res) {
  var self = this;
  if (req.method === 'GET') {
    var query = url.parse(req.url).query;
    var token = qs.parse(query).token;

    this.server.invites.get(token, function (err, invite) {
      if (err || invite.accepted) {
        res.writeHead(302, { 'Location': '/' });
        return res.end();
      }
      else {
        invite.accepted = true;
        self.server.invites.put(token, invite);
        var data = { email: invite.email };
        return response()
          .html(self.server.render('invite-accept', data))
          .pipe(res);
      }
    });
  }

  if (req.method === 'POST') {
    // LMS: No authentication here???
    // Can't someone just create a post here with the 'body' data to create an account?
    // Perhaps a session can be created under the 'acceptInvite' GET request, then we can
    // authorize it here?
    formBody(req, res, function (err, body) {

      var opts = {
        login: {
          basic: {
            username: body.username,
            password: body.password
          }
        },
        value: {
          admin: true,
          email: body.email,
          username: body.username,
          color: randomColor(),
          uuid: uuid()
        }
      };

      self.server.accountdown.create(opts.value.uuid, opts, function (err) {
        //todo: notification of error on page
        if (err) return console.error(err);

        self.server.auth.login(res, { uuid: opts.value.uuid }, function (loginerr, data) {
          if (loginerr) console.error(loginerr);

          res.writeHead(302, { 'Location': '/' });
          return res.end();
        });
      });
    });
  }
};

/*
 * Helper functions
 */

function logIfError(err) {
  // TODO: implement a notification of error on page
  if (err) console.error(err);

}

// TODO: Move these methods into an npm module?
Accounts.prototype.createAccountFromForm = function (req, res, cb) {
  var self = this;
  formBody(req, res, function(err, body) {
    if (err) return console.log(err);
    self.modifyAccountFromForm({}, body, uuid(), self.createAccountFromOpts.bind(self), cb);
  });
};

Accounts.prototype.createAccountFromOpts = function (account, cb) {
  this.server.accountdown.create(account.value.uuid, account, function (err) {
    if (cb) return cb(err);
    else logIfError(err);
  });
};

Accounts.prototype.updateAccountFromForm = function (req, res, uuid, cb) {
  var self = this;
  self.server.accountdown.get(uuid, function (err, existingAccount) {
    if (err) return console.log(err);
    formBody(req, res, function (err, body) {
      if (err) return console.log(err);
      if (body.username || body.password) {
        // If username or password has been modified, we call this to alter the account-basic store
        self.modifyAccountFromForm(existingAccount, body, uuid, self.recreateAccountFromOpts.bind(self), cb);
      } else {
        self.modifyAccountFromForm(existingAccount, body, uuid, self.updateAccountFromOpts.bind(self), cb);
      }
    });
  });
};

// When the username and/or password has been updated
Accounts.prototype.recreateAccountFromOpts = function (account, cb) {
  var self = this;
  this.server.accountdown.remove(account.value.uuid, function (err) {
    if (err) return console.log("err while deleting old account:", err);
    self.server.accountdown.create(account.value.uuid, account, function (err) {
      if (cb) return cb(err);
      else logIfError(err);
    });
  });
}

Accounts.prototype.updateAccountFromOpts = function (account, cb) {
  var self = this;
  self.server.accountdown.put(account.value.uuid, account.value, function (err) {
    if (cb) return cb(err);
    else logIfError(err);
  });
};

Accounts.prototype.modifyAccountFromForm = function (existingAccount, body, accountUuid, accountOperation, cb) {
  var account = {
    login: {
      basic: {
        username: (existingAccount.username || body.username),
        password: body.password
      }
    },
    value: {
      admin: body.hasOwnProperty('admin') ? body.admin !== 'unchecked' : existingAccount.admin,
      color: (existingAccount.color || randomColor()),
      email: (body.email || existingAccount.email),
      username: (body.username || existingAccount.username),
      uuid: accountUuid
    }
  };
  accountOperation(account, cb);
};

Accounts.prototype.renderAccountUpdateForm = function (res, accountUuid, account) {
  var self = this;
  this.server.accountdown.get(accountUuid, function (err, value) {
    if (err) {
      return console.log(err);
    }
    value['uuid'] = accountUuid;
    var ctx = { editingAccount: value, account: account };
    response()
      .html(self.server.render('account-update', ctx)).pipe(res);
  });
};
