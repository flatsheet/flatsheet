var extend = require('extend')
var response = require('response')
var JSONStream = require('JSONStream')
var jsonBody = require('body/json')
var through = require('through2')
var filter = require('filter-object')

module.exports = AccountsApiHandler

function AccountsApiHandler (server) {
  if (!(this instanceof AccountsApiHandler)) {
    return new AccountsApiHandler(server)
  }
  this.server = server
  this.tokens = server.tokens
}

/*
 * GET: return all accounts
 * POST: create a new account (admins only)
 */
AccountsApiHandler.prototype.accounts = function (req, res) {
  var self = this
  // Verify that we have a permission token
  console.log("AccountsApiHandler.accounts: getting verified")
  this.tokens.verify(req, function(err, decoded) {
    if (err) return response().status('401').json({error: 'Error verifying web token' + err}).pipe(res)
    if (!decoded) return response().status('401').json({error: 'Not authorized'}).pipe(res)

    /*
     *  Get list of accounts
     */

    console.log("\n\nAccountsApiHandler.accounts: verfied!")
    if (req.method === 'GET') {
        return self.server.accounts.list({keys: false})
          .pipe(filterAccountDetails())
          .pipe(JSONStream.stringify())
          .pipe(res)
    }

     /*
      *  Create a new account
      */

    if (req.method === 'POST') {
      if (!decoded.admin) return response().status('401').json({error: 'Must be admin to create new accounts'}).pipe(res)
      jsonBody(req, res, function (err, body) {
        if (err) return response().status(500).json({ error: err }).pipe(res)
        var opts = {
          login: { basic: { username: body.username, password: body.password } },
          value: filter(body, '!password')
        }

        self.server.accounts.create(body.username, opts, function (err) {
          if (err) return response().status(500).json({ error: 'Unable to create new user' }).pipe(res)

          self.server.accounts.get(body.username, function (err, account) {
            if (err) return response().status(500).json({ error: 'Server error' }).pipe(res)

            response().json(account).pipe(res)
          })
        })
      })
    }
  })
}

/*
 * GET: return an account
 * PUT: update an account (admins only)
 * DELETE: remove an account (admins only)
 */
AccountsApiHandler.prototype.accountFromUsername = function (req, res, opts) {
  var self = this
  this.permissions.authorize(req, res, function (authError, authAccount, session) {
    var notAuthorized = (authError || !authAccount)

    /*
     *  Get individual account
     */

    if (req.method === 'GET') {
      self.server.accounts.get(opts.params.username, function (err, account) {
        if (err) return response().status('500').json({error: 'Could not retrieve the account'}).pipe(res)
        if (notAuthorized) {
          account = filter(account, ['*', '!email', '!admin'])
        }
        return response().json(account).pipe(res)
      })
    }

    /*
     *  Update an account
     */

    if (req.method === 'PUT') {
      if (notAuthorized) return response().status('401').json({error: 'Not Authorized'}).pipe(res)
      if (!authAccount.admin) return response().status('401').json({error: 'Must be admin to update accounts'}).pipe(res)
      jsonBody(req, res, opts, function (err, body) {
        if (err) return response().status(500).json({ error:'Could not parse the request\'s body' }).pipe(res)
        self.server.accounts.get(opts.params.username, function (err, account){
          if (err) return response().status(500).json({ error:'Username does not exist' }).pipe(res)
          account = extend(account, body)
          self.server.accounts.put(opts.params.username, account, function (err) {
            if (err) return response().status(500).json({ error:'Server error' }).pipe(res)
            response().json(account).pipe(res)
          })
        })
      })
    }

    /*
     *  Delete an account
     */

    if (req.method === 'DELETE') {
      if (notAuthorized) return response().status('401').json({ error: 'Not Authorized'}).pipe(res)
      if (!authAccount.admin) return response().status('401').json({error: 'Must be admin to delete accounts'}).pipe(res)
      self.server.accounts.remove(opts.params.username, function (err, account) {
        if (err) return response().status(500).json({ error:'Username does not exist' }).pipe(res)
        return response().json(account).pipe(res)
      })
    }
  })
}

/*
 * Helper functions
 */

function filterAccountDetails () {
  return through.obj(function iterator(chunk, enc, next) {
    this.push(filter(chunk, ['*', '!email', '!admin']))
    next()
  })
}
