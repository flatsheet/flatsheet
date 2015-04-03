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
}

/*
 * Route callbacks
 */
Accounts.prototype.getListOfAccounts = function (req, res) {
  var self = this;
  this.server.authorizeSession(req, res, function (error, user, session) {
    if (!user.admin || error) {
      if (error) {
        console.log(error);
      }
      res.writeHead(302, {'Location': '/'});
      return res.end();
    }
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
          var ctx = {accounts: results};
          return response().html(self.server.render('account-list', ctx)).pipe(res);
        });
    }
  });
};

Accounts.prototype.signIntoAccount = function (req, res) {
  if (req.method === 'GET') {
    if (res.account) {
      res.writeHead(302, { 'Location': '/' });
      return res.end();
    }
    else return response().html(this.server.render('signin')).pipe(res);
  }
};

Accounts.prototype.createAdminAccount = function (req, res) {
  var self = this;
  this.server.authorizeSession(req, res, function (error, user, session) {
    if (!user.admin || error) {
      if (error) console.log(error);
      res.writeHead(302, { 'Location': self.prefix });
      return res.end();
    }
    if (req.method === 'GET') {
      return response()
        .html(self.server.render('account-new')).pipe(res);
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
    if (res.account) {
      this.server.getUserBySession(req, function (err, user, session) {
        return response().html(self.server.render('account-update')).pipe(res);
      });
    }
    else return response()
      .html(this.server.render('account-new')).pipe(res);
  }

  if (req.method === 'POST') {
    this.createAccountFromForm(req, res);
    res.writeHead(302, { 'Location': '/' });
    return res.end();
  }
};

Accounts.prototype.deleteAccount = function (req, res, opts) {
  var self = this;
  this.server.authorizeSession(req, res, function (error, user, session) {
    if (user.admin && !error) {
      if (req.method === 'POST') {
        // TODO: Remove account username from all sheet permissions
        self.server.accountdown.remove(opts.params.username, logIfError);
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
  this.server.authorizeSession(req, res, function (error, user, session) {
    if (error) redirect(res, '/');

    if (user.admin) {
      if (req.method === 'POST') {
        self.updateAccountFromForm(req, res, opts.params);
        res.writeHead(302, {'Location': self.prefix });
        return res.end();
      }
      if (req.method === 'GET') {
        self.renderAccountUpdateForm(res, opts.params.username, user);
      }
    } else {
      if (res.account.key !== opts.params.username) {
        return console.log("You must be admin to update an account which is not yours");
      }
      // When we are only changing the current account:
      if (req.method === 'POST' ) {
        self.updateAccountFromForm(req, res, opts.params);
      }
      if (req.method === 'GET') {
        self.renderAccountUpdateForm(res, opts.params.username, user);
      }
      res.writeHead(302, {'Location': '/'});
      return res.end();
    }
  });
};

Accounts.prototype.invite = function (req, res) {
  if (res.account && res.account.admin) {
    if (req.method === 'GET') {
      return response().html(this.server.render('invite')).pipe(res);
    }

    if (req.method === 'POST') {
      var self = this;
      formBody(req, res, function (err, body) {
        //todo: notification of error on page
        if (err) console.error(err);

        var emails = body.emails.split('\r\n');

        emails.forEach(function (email) {
          var token = uuid();
          var opts = { email: email, accepted: false };
          this.invites.put(token, opts, function (err) {
            if (err) console.log(new Error(err));

            var data = {
              url: self.server.site.url + '/accounts/accept?token=' + token,
              from: self.server.site.email,
              fromname: self.server.site.contact
            };

            var message = {
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
};

Accounts.prototype.acceptInvite = function (req, res) {
  var self = this;
  if (req.method === 'GET') {
    var query = url.parse(req.url).query;
    var token = qs.parse(query).token;

    server.invites.get(token, function (err, invite) {
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
          color: randomColor()
        }
      };

      self.createAccount(body.username, opts, function (err) {
        //todo: notification of error on page
        if (err) return console.error(err);

        self.server.auth.login(res, { username: body.username }, function (loginerr, data) {
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
// NOTE: To make these methods private, we can wrap the module in a function expression
// (ie `Accounts = (function() {...})(); module.exports = Accounts;)

function logIfError(err) {
  // TODO: implement a notification of error on page
  if (err) console.error(err);

}

Accounts.prototype.createAccountFromForm = function (req, res) {
  var self = this;
  formBody(req, res, function(err, body) {
    self.modifyAccountFromForm(err, body, body.username, self.createAccountFromOpts.bind(self));
  });
};

Accounts.prototype.updateAccountFromForm = function (req, res, params) {
  var self = this;
  formBody(req, res, function(err, body) {
    self.modifyAccountFromForm(err, body, params.username, self.updateAccountFromOpts.bind(self));
  });
};

Accounts.prototype.createAccountFromOpts = function (opts) {
  this.server.accountdown.create(opts.login.basic.username, opts, logIfError);
};

Accounts.prototype.updateAccountFromOpts = function (opts) {
  var username = opts.login.basic.username;
  var self = this;
  this.server.accountdown.get(username, function (err, value) {
    delete opts.value.color; // We don't want to replace the color
    for (var key in value) { // Add existing features from the original value
      if (value.hasOwnProperty(key) && !opts.value.hasOwnProperty(key)) {
        opts.value[key] = value[key];
      }
    }
    self.server.accountdown.put(username, opts.value, logIfError);
  });
};

Accounts.prototype.modifyAccountFromForm = function (err, body, username, accountOperation) {
  body.admin = !!body.admin; // ie 'true' => true

  var opts = {
    login: {
      basic: {
        username: username,
        password: body.password
      }
    },
    value: {
      admin: body.admin,
      color: randomColor(),
      email: body.email,
      username: username
    }
  };
  accountOperation(opts);
};

Accounts.prototype.renderAccountUpdateForm = function (res, username, user) {
  var self = this;
  this.server.accountdown.get(username, function (err, value) {
    if (err) {
      return console.log(err);
    }
    var ctx = { editingAccount: value, account: user };
    response()
      .html(self.server.render('account-update', ctx)).pipe(res);
  });
};
