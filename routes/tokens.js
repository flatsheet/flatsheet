var Router = require('match-routes')

module.exports = function (server, prefix) {
  var prefix = prefix || '/tokens'
  var router = Router()
  var handler = require('../handlers/tokens')(server.secretToken)
  handler.prefix = prefix

  /*
   * Create a token
   */
  router.on(prefix, handler.createToken.bind(handler))

  /*
   * Destroy a session
   */
  router.on(prefix + '/destroy', handler.destroyToken.bind(handler))

  return router
}


