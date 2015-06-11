var formBody = require('body/form')
var redirect = require('../lib/redirect')

module.exports = Sessions

function Sessions (server) {
  if (!(this instanceof Sessions)) {
    return new Sessions(server)
  }
  this.auth = server.auth
  this.accountsIndexes = server.accountsIndexes
  this.accounts = server.accounts
}

Sessions.prototype.createSession = function (req, res) {
  var self = this
  if (req.method === 'POST') {
    formBody(req, res, function (err, body) {
      var identifier = body.usernameOrEmail.trim()
      var creds = { password: body.password }
      self.accounts.findOne(identifier, function (err, account) {
        creds.key = account.key
        return self.verify(res, creds)
      })
    })
  }
}

Sessions.prototype.destroySession = function (req, res) {
  var self = this
  this.auth.delete(req, function () {
    self.auth.cookie.destroy(res)
    redirect(res, '/')
  })
}

Sessions.prototype.verify = function (res, creds) {
  var self = this
  this.accounts.verify('basic', creds, function (err, ok, id) {
    if (err) return console.error(err)
    if (!ok) return console.error(ok)
    // TODO: notify user about incorrect password, and offer reset password option (issue #47)

    self.auth.login(res, {key: id}, function (loginerr, data) {
      if (loginerr) console.error(loginerr)
      redirect(res, '/')
    })
  })
}
