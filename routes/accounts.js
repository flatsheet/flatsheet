var response = require('response');
var JSONStream = require('JSONStream');
var formBody = require('body/form');
var randomColor = require('random-color');

exports.install = function (server, prefix) {
  var prefix = prefix || '/account';


  /*
  * Get list of accounts
  */

  server.route(prefix + '/list', function (req, res) {
    if (req.method === 'GET') {
      return server.accounts.list()
        .pipe(JSONStream.stringify())
        .pipe(res);
    }
  });


  /*
  *  Sign in
  */

  server.route(prefix + '/sign-in', function (req, res) {
    if (req.method === 'GET') {
      if (res.account) {
        res.writeHead(302, { 'Location': '/' });
        return res.end();
      }
      else return response().html(server.render('signin')).pipe(res);
    }
  });


  /*
  *  Create an account
  */

  server.route(prefix, function (req, res) {
    if (req.method === 'GET') {
      if (res.account) response()
        .html(server.render('account-update')).pipe(res);

      else return response()
        .html(server.render('account-new')).pipe(res);
    }

    if (req.method === 'POST') {
      formBody(req, res, function (err, body) {

        var opts = {
          login: {
            basic: {
              username: body.username,
              password: body.password
            }
          },
          value: {
            email: body.email,
            username: body.username,
            color: randomColor()
          }
        };

        server.accounts.create(body.username, opts, function (err) {

          //todo: notification of error on page
          if (err) console.error(err);

          req.session.set(req.session.id, opts.value, function (sessionerr) {
            if (err) console.error(sessionerr);
            res.writeHead(302, { 'Location': '/' });
            return res.end();
          });

        });
      });
    }

  });


  /*
  * Invite users to create accounts
  */

  server.route(prefix + '/update', function (req, res) {
    if (req.method === 'POST') {
      formBody(req, res, function (err, body) {

        server.accounts.update(body.username, {}, function (err) {

          //todo: notification of error on page
          if (err) console.error(err);

          req.session.set(req.session.id, opts.value, function (sessionerr) {
            if (err) console.error(sessionerr);
            res.writeHead(302, { 'Location': '/' });
            return res.end();
          });

        });
      });
    }
  });


  /*
  * Invite users to create accounts
  */

  server.route(prefix + '/invite', function (req, res) {
    if (res.account.admin) {
      if (req.method === 'GET') {
        return response().html(server.render('invite')).pipe(res);
      }

      if (req.method === 'POST') {
        formBody(req, res, function (err, body) {
          //todo: notification of error on page
          if (err) console.error(err);

          console.log(body);

        });
      }
    }
    else {
      res.writeHead(302, { 'Location': '/' });
      return res.end();
    }
  });

}
