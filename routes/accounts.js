var response = require('response');
var JSONStream = require('JSONStream');
var formBody = require('body/form');

exports.install = function (server, prefix) {
  var prefix = prefix || '/account';

  /*
  *  Sign in
  */

  server.route(prefix + '/sign-in', function (req, res) {
    if (req.method === 'GET') {
      if (res.account) {
        res.writeHead(302, { 'Location': '/' });
        res.end();
      }
      else return response().html(server.views.signin({})).pipe(res);
    }
  });

  server.route(prefix, function (req, res) {
    if (req.method === 'GET') {
      return response().html(server.views.account({})).pipe(res);
    }

    if (req.method === 'POST') {
      formBody(req, res, function (err, body) {

        var opts = {
          login: { basic: { username: body.username, password: body.password } },
          value: { email: body.email, username: body.username }
        };

        server.accounts.create(body.username, opts, function (err) {

          //todo: notification of error on page
          if (err) console.error(err);

          req.session.set(req.session.id, opts.value, function (sessionerr) {
            if (err) console.error(sessionerr);
            res.writeHead(302, { 'Location': '/' });
            res.end();
          });

        });
      });
    }
  });


  /*
  * Update an account
  */

  server.route(prefix + '/:id', function (req, res) {
    // if post, update
    // if delete, destroy
    // todo
  });


  /*
  * Invite users to create accounts
  */

  server.route(prefix + '/invite', function (req, res) {

  });
}
