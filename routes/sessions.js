var response = require('response');
var JSONStream = require('JSONStream');
var formBody = require('body/form');
var redirect = require('../util/redirect');

exports.install = function (server, prefix) {
  var prefix = prefix || '/session';


  /*
  * Create a session
  */

  server.route(prefix, function (req, res) {
    if (req.method === 'POST') {
      formBody(req, res, function (err, body) {
        var creds = { username: body.username, password: body.password };

        server.accounts.verify('basic', body, function (err, ok, id) {          
          if (err) console.error(err);

          server.auth.login(res, { username: id }, function (loginerr, data) {
            if (loginerr) console.error(loginerr);
            redirect(res, '/');
          });
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
