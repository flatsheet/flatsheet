var Router = require('match-routes')

/**
* Accounts API Handler
*/
module.exports = function (server, prefix) {
  var handler = require('../handlers/accounts-api')(server)
  var prefix = prefix || '/api/v2/'
  var router = Router()

  router.on(prefix + 'accounts', handler.accounts.bind(handler))
  router.on(prefix + 'accounts/:key', handler.accountFromUsername.bind(handler))

  return router
}