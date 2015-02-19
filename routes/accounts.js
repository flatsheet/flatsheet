var qs = require('querystring')
var url = require('url');
var response = require('response');
var JSONStream = require('JSONStream');
var formBody = require('body/form');
var randomColor = require('random-color');
var uuid = require('uuid').v1;


exports.install = function (server, prefix) {
  var prefix = prefix || '/account';


  /*
  * Get list of accounts (admin only)
  */

  server.route(prefix + '/list', function (req, res) {
    // check if the user is an admin
    console.log("inside /list");
    var cb = function (first, user, session) {
      console.log("/list: current user: ");
      console.log(user.username);
      console.log("/list: are we admin: ");
      console.log(user.admin);
      if (user.admin) {
        console.log("session is authorized");
        if (req.method === 'GET') {
          return server.accounts.list()
              .pipe(JSONStream.stringify())
              .pipe(res);
        }
      } else {
        console.log("session is not authorized to view accounts list");
        res.writeHead(302, { 'Location': '/' });
        return res.end();
      }
    };
    server.authorizeSession(req, res, cb);
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
    if (res.account && res.account.admin) {
      if (req.method === 'GET') {
        return response().html(server.render('invite')).pipe(res);
      }

      if (req.method === 'POST') {
        formBody(req, res, function (err, body) {
          //todo: notification of error on page
          if (err) console.error(err);

          var emails = body.emails.split('\r\n');

          emails.forEach(function (email) {
            var token = uuid();
            var opts = { email: email, accepted: false };
            server.invites.put(token, opts, function (err) {
              if (err) console.log(new Error(err));

              var data = {
                url: server.site.url + '/account/accept?token=' + token,
                from: server.site.email,
                fromname: server.site.contact
              };

              var message = {
                to: email,
                from: server.site.email,
                fromname: server.site.contact,
                subject: 'Help me curate data with Flatsheet',
                text: server.render('invite-email', data),
                html: server.render('invite-email', data)
              };

              server.email.sendMail(message, function(err, info){
                if (err) return console.log(err);
                return response()
                  .html(server.render('invite', { emails: emails }))
                  .pipe(res);
              });
            });
          });
        });
      }
    }
    else {
      res.writeHead(302, { 'Location': '/' });
      return res.end();
    }
  });


  /*
  * Accept invitation
  */

  server.route(prefix + '/accept', function (req, res) {
    if (req.method === 'GET') {
      var query = url.parse(req.url).query;
      var token = qs.parse(query).token;

      server.invites.get(token, function (err, invite) {
        if (err || invite.accepted) {
          res.writeHead(302, { 'Location': '/' });
          return res.end();
        }
        else {
          invite.accepted = true;
          server.invites.put(token, invite);
          var data = { email: invite.email };
          return response()
            .html(server.render('invite-accept', data))
            .pipe(res);
        }
      });
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
            admin: true,
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

}
