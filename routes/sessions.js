var Router = require('match-routes');

module.exports = function (server, prefix) {

  var prefix = prefix || '/sessions';
  var router = Router();
  var handler = require('../handlers/sessions')(server);
  handler.prefix = prefix;

  /*
   * Create a session
   */
  router.on(prefix, handler.createSession.bind(handler));
  /*
   * Destroy a session
   */
  router.on(prefix + '/destroy', handler.destroySession.bind(handler));

  return router;
}



