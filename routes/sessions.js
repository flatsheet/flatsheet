var uuid = require('uuid').v1;
var formBody = require('body/form');
var redirect = require('../lib/redirect');
var Router = require('match-routes');

module.exports = function (server, prefix) {
  var prefix = prefix || '/sessions';
  var router = Router();

  /*
   * Create a session
   */
  router.on(prefix, function (req, res) {
    if (req.method === 'POST') {
      formBody(req, res, function (err, body) {
        if (body.username) {
          body.username = body.username.trim();
        }
        server.accountdown.verify('basic', body, function (err, ok, id) {
          if (err) {
            console.error(err);
          } else if (!ok) {
            // TODO: notify user about incorrect password, and offer reset password option (issue #47)
          } else {
            server.auth.login(res, {uuid: id}, function (loginerr, data) {
              if (loginerr) console.error(loginerr);
            });
          }
          redirect(res, '/');
        });
      });
    }
  });

  /*
   * Destroy a session
   */
  router.on(prefix + '/destroy', function (req, res) {
    server.auth.delete(req, function () {
      server.auth.cookie.destroy(res);
      redirect(res, '/');
    });
  });

  return router;
}

