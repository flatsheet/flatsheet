var response = require('response');
var JSONStream = require('JSONStream');
var formBody = require('body/form');
var redirect = require('../lib/redirect');

exports.install = function (server, prefix) {
  var prefix = prefix || '/sessions';


  /*
  * Create a session
  */

  server.route(prefix, function (req, res) {
    if (req.method === 'POST') {
      formBody(req, res, function (err, body) {

        server.accountdown.verify('basic', body, function (err, ok, id) {
          if (err) {
            console.error(err);
          } else if (!ok) {
            // TODO: notify user about incorrect password, and offer reset password option (issue #47)
          } else {
            server.auth.login(res, { username: id }, function (loginerr, data) {
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

  server.route(prefix + '/destroy', function (req, res) {
    server.auth.delete(req, function () {
      server.auth.cookie.destroy(res);
      redirect(res, '/');
    });
  });
}
