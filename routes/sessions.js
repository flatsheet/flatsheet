var response = require('response');
var JSONStream = require('JSONStream');
var formBody = require('body/form');

exports.install = function (server, prefix) {
  var prefix = prefix || '/session';

  /*
  * Create a session
  */

  server.route(prefix, function (req, res) {
    if (req.method === 'POST') {
      formBody(req, res, function (err, body) {
        server.accounts.verify('basic', body, function (err, ok) {
          if (err) return console.error(err)
          if (ok) {

            server.accounts.get(body.username, function (err, account) {
              req.session.set(req.session.id, account, function (sessionerr) {
                if (err) console.error(sessionerr);
                res.writeHead(302, { 'Location': '/' });
                res.end();
              });
            });
          }
        });
      });

    }
  });


  /*
  * Destroy a session
  */

  server.route(prefix + '/destroy', function (req, res) {
    if (req.method === 'POST') {
      req.session.destroy(function (err) {
        if (err) console.error(err);
        res.writeHead(302, { 'Location': '/' });
        res.end();
      });
    }
  });
}
