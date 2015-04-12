var response = require('response');
var Router = require('match-routes');
var redirect = require('../lib/redirect');

module.exports = function (server, prefix) {
  var router = Router()

  router.on('/', function (req, res, options) {
    server.getAccountBySession(req, function (err, account, session) {
      if (account.active) return redirect(res, '/sheets');
      var html = server.render('index', { account: account });
      response().html(html).pipe(res);
    });
  })

  return router
}
