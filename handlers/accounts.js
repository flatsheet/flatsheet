var uuid = require('uuid').v1
var extend = require('extend')
var response = require('response')
var formBody = require('body/form')
var qs = require('querystring')
var url = require('url')
var redirect = require('../lib/redirect')

module.exports = Accounts

function Accounts (server) {
  if (!(this instanceof Accounts)) {
    return new Accounts(server)
  }
  this.server = server
  this.permissions = require('../lib/permissions')(server)
  var validator = require('is-my-json-valid')
  var validate = validator({
    required: true,
    type: 'object',
    properties: {
      login: {
        required: false,
        type: 'object',
        properties: {
          basic: {
            required: true,
            type: 'object',
            properties: {
              key: {
                required: true,
                type: 'string'
              },
              password: {
                required: true,
                type: 'string'
              }
            }
          }

        },
      value: {
        required: true,
        type: 'object',
        properties: {
          key: {
            required: true,
            type: 'string'
          },
          admin: {
            required: false,
            type: 'boolean'
          },
          color: {
            required: false,
            type: 'string'
          },
          username: {
            required: false,
            type: 'string'
          },
          email: {
            required: false,
            type: 'string'
          }
        }
      }

      }
    }
  }, {
    verbose: true
  })
  opts = {
    validate: validate,
    format: function (body) {
      body.value.admin = !!(body.value.admin)
      if (body.value.key && body.login) {
        body.login.basic.key = body.value.key
      }
      return body
    },
    updateLoginCreds: function (account) {
      return Object.prototype.hasOwnProperty.call(account, 'login')
    }
  }
  this.forms2accounts =
    require('accountdown-parser')(server.accounts, opts)
}

/*
 * Route callbacks
 */
Accounts.prototype.getListOfAccounts = function (req, res) {
  var self = this
  this.permissions.authorizeSession(req, res, function (error, account, session) {
    if (!account.admin || error) return redirect(res, '/')

    if (req.method === 'GET') {
      var results = []
      var stream = self.server.accounts.list()

      stream
        .on('data', function (data) {
          results.push(data)
        })
        .on('error', function (err) {
          return console.log(err)
        })
        .on('end', function () {
          var ctx = { accounts: results, account: account }
          return response().html(self.server.render('account-list', ctx)).pipe(res)
        })
    }
  })
}

Accounts.prototype.signIntoAccount = function (req, res) {
  var self = this
  if (req.method === 'GET') {
    this.server.getAccountBySession(req, function (err, account, session) {
      if (err || !account) return console.log("signing in: retrieving account from session failed:", err)
      if (account) {
        res.writeHead(302, { 'Location': '/' })
        return res.end()
      }
      else return response().html(self.server.render('signin')).pipe(res)
    })
  }
}

Accounts.prototype.createAccountAsAdmin = function (req, res) {
  var self = this
  this.permissions.authorizeSession(req, res, function (error, account, session) {
    if (!account.admin || error) {
      if (error) console.log(error)
      res.writeHead(302, { 'Location': self.prefix })
      return res.end()
    }
    if (req.method === 'GET') {
      return response()
        .html(self.server.render('account-new', { account: account }))
        .pipe(res)
    }
    if (req.method === 'POST') {
      self.forms2accounts.create(req, res, function(err, account) {
        if (err) return console.log("createAccountAsAdmin: error creating account", err)
        res.writeHead(302, {'Location' : self.prefix})
        return res.end()
      })
    }
  })
}

Accounts.prototype.createAccount = function (req, res) {
  var self = this
  if (req.method === 'GET') {
    this.server.getAccountBySession(req, function (err, account, session) {
      if (error) return console.log(error)
      return response()
        .html(self.server.render('account-new'))
        .pipe(res)
    })
  }

  if (req.method === 'POST') {
    this.forms2accounts.create(req, res, function (err, account) {
      if (err) return console.log("Accounts.createAccount: error creating account:", err)
      res.writeHead(302, {'Location': '/'})
      return res.end()
    })
  }
}

Accounts.prototype.deleteAccount = function (req, res, opts) {
  var self = this
  this.permissions.authorizeSession(req, res, function (error, user, session) {
    if (error) return console.log(error)
    if (user.admin) {
      if (req.method === 'POST') {
        // TODO: Remove account username from all sheet permissions
        self.server.accounts.remove(opts.params.key, function (err) {
          if (err) return console.log("Error removing account")
          res.writeHead(302, {'Location': self.prefix})
          return res.end()
        })
      }
    } else {
      res.writeHead(302, { 'Location': '/' })
      return res.end()
    }
  })
}

Accounts.prototype.updateAccount = function (req, res, opts) {
  var self = this
  this.permissions.authorizeSession(req, res, function (error, account, session) {
    if (error) redirect(res, '/')
    if (req.method === 'POST') {
      // check if we are updating the current account as a non-admin:
      if (account.key !== opts.params.key && !account.admin) {
        // TODO: Flash notification (?)
        console.log("WARNING: You must be admin to update an account which is not yours")
        res.writeHead(302, {'Location': self.prefix })
        return res.end()
      }
      self.forms2accounts.update(req, res, opts.params.key, function (err, account) {
        if (err) return console.log("Error updating account from form: ", err)
        res.writeHead(302, {'Location': self.prefix })
        return res.end()
      })
    }
    if (req.method === 'GET') {
      self.renderAccountUpdateForm(res, opts.params.key, account)
    }
  })
}

Accounts.prototype.passwordReset = function (req, res, opts) {
  var self = this
  if (req.method === 'GET') {

    this.server.getAccountBySession(req, function (err, account, session) {
      if (account) {
        return response()
          .html(self.server.render('password-reset', {account: account}))
          .pipe(res)
      }
    })
  } else if (req.method === 'POST') {
    this.permissions.authorizeSession(req, res, function (error, account, session) {
      if (error) return console.error("error authorizing session:", error)
      if (account) {
        self.forms2accounts.update(req, res, opts.params.key, function (err, account) {
          if (err) return console.log(err)

          // delete then recreate the session token since the login account has been recreated
          // when the password was updated (not sure if this is necessary...)
          self.server.auth.delete(req, function () {
            self.server.auth.cookie.destroy(res)
            self.server.auth.login(res, {key: account.key}, function (loginerr, data) {
              if (loginerr) return console.log(loginerr)
              res.writeHead(302, {'Location': '/'})
              return res.end()
            })
          })

        })
      } else {
        return response().html(self.server.render('signin')).pipe(res)
      }
    })
  }
}

Accounts.prototype.passwordAcceptReset = function (req, res) {
  var self = this
  if (req.method === 'GET') {
    var query = url.parse(req.url).query
    var token = qs.parse(query).token
    var key = qs.parse(query).key
    this.server.resets.get(token, function (err, resetReq) {
      if (err || resetReq.accepted) {
        res.writeHead(302, { 'Location': '/' })
        return res.end()
      } else {
        self.server.auth.login(res, { key: key }, function (loginerr, data) {
            if (loginerr) return console.error("login error:", loginerr)
          self.server.accounts.get(key, function (err, account) {
            if (err) return console.err("error retrieving password reset account:", err)
            resetReq.accepted = true
            self.server.resets.put(token, resetReq)
            return response()
              .html(self.server.render('password-reset', {account: account}))
              .pipe(res)
          })
        })
      }
    })
  }
}

Accounts.prototype.invite = function (req, res) {
  var self = this
  
  this.server.getAccountBySession(req, function (err, account, session) {
    if (account && account.admin) {
      if (req.method === 'GET') {
        return response()
          .html(self.server.render('invite', { account: account }))
          .pipe(res)
      }

      if (req.method === 'POST') {
        // Shouldn't we authorize the account session token here???
        formBody(req, res, function (err, body) {
          //todo: notification of error on page
          if (err) console.error(err)

          var emails = body.emails.split('\r\n')

          emails.forEach(function (email) {
            var token = uuid()
            var opts = { email: email, accepted: false }
            self.server.invites.put(token, opts, function (err) {
              if (err) console.log(new Error(err))
              
              var data = {
                url: self.server.site.url + '/accounts/accept?token=' + token,
                from: self.server.site.email,
                fromname: self.server.site.contact
              }

              var message = { // Should these be from the current account, or Flatsheet server?
                to: email,
                from: self.server.site.email,
                fromname: self.server.site.contact,
                subject: 'Help me curate data with Flatsheet',
                text: self.server.render('invite-email', data),
                html: self.server.render('invite-email', data)
              }

              self.server.email.sendMail(message, function(err, info){
                if (err) return console.log(err)
                return response()
                  .html(self.server.render('invite', { emails: emails }))
                  .pipe(res)
              })
            })
          })
        })
      }
    }
    else {
      res.writeHead(302, { 'Location': '/' })
      return res.end()
    }
  })
}

Accounts.prototype.acceptInvite = function (req, res, opts) {
  var self = this
  if (req.method === 'GET') {
    var query = url.parse(req.url).query
    var token = qs.parse(query).token

    this.server.invites.get(token, function (err, invite) {
      if (err || invite.accepted) {
        res.writeHead(302, { 'Location': '/' })
        return res.end()
      }
      else {
        invite.accepted = true
        self.server.invites.put(token, invite)
        var data = { email: invite.email }
        return response()
          .html(self.server.render('invite-accept', data))
          .pipe(res)
      }
    })
  }

  if (req.method === 'POST') {
    // LMS: No authentication here???
    // Can't someone just create a post here with the 'body' data to create an account?
    // Perhaps a session can be created under the 'acceptInvite' GET request, then we can
    // authorize it here?
    self.forms2accounts.create(req, res, function (err, account) {
      //todo: notification of error on page
      if (err) return console.error(err)
      self.server.auth.login(res, {key: account.key}, function (loginerr, data) {
        if (loginerr) console.error(loginerr)

        res.writeHead(302, {'Location': '/'})
        return res.end()
      })
    })
  }
}

/*
 * Helper functions
 */

Accounts.prototype.renderAccountUpdateForm = function (res, accountUuid, account) {
  var self = this
  this.server.accounts.get(accountUuid, function (err, value) {
    if (err) return console.log(err)
    value['key'] = accountUuid
    var ctx = { editingAccount: value, account: account }
    response()
      .html(self.server.render('account-update', ctx)).pipe(res)
  })


}
