var qs = require('querystring');
var url = require('url');
var response = require('response');
var JSONStream = require('JSONStream');
var formBody = require('body/form');
var randomColor = require('random-color');
var uuid = require('uuid').v1;

exports.install = function (server, prefix) {
  prefix = prefix || '/accounts';

  /*
  * Get list of accounts (admin only)
  */

  server.route(prefix, function (req, res) {
    server.authorizeSession(req, res, function (error, user, session) {
      if (!user.admin || error) {
        if (error) {
          console.log(error);
        }
        res.writeHead(302, {'Location': '/'});
        return res.end();
      }
      if (req.method === 'GET') {
        var results = [];
        var stream = server.accounts.list();

        stream
          .on('data', function (data) {
            results.push(data);
          })
          .on('error', function (err) {
            return console.log(err);
          })
          .on('end', function () {
            var ctx = {accounts: results};
            return response().html(server.render('account-list', ctx)).pipe(res);
          });
      }
    });
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
   * Utility functions and variables
   * TODO: export these as a module
   */
  function logIfError(err) {

    // TODO: implement a notification of error on page
    if (err) console.error(err);

    // TODO: do we need this? setting the session here fails - req.session is undefined
    //req.session.set(req.session.id, opts.value, function (sessionerr) {
    //  if (err) console.error(sessionerr);
    //  res.writeHead(302, { 'Location': '/' });
    //  return res.end();
    //});
  }

  function createAccountFromForm(req, res) {
    formBody(req, res, function(err, body) {
      modifyAccountFromForm(err, body, body.username, createAccount);
    });
  }

  function updateAccountFromForm(req, res, params) {
    formBody(req, res, function(err, body) {
      modifyAccountFromForm(err, body, params.username, updateAccount);
    });
  }
  function createAccount(opts) {
    server.accounts.create(opts.login.basic.username, opts, logIfError);
  }
  function updateAccount(opts) {
    var username = opts.login.basic.username;
    server.accounts.get(username, function (err, value) {
      delete opts.value.color; // We don't want to replace the color
      for (var key in value) { // Add existing features from the original value
        if (value.hasOwnProperty(key) && !opts.value.hasOwnProperty(key)) {
          opts.value[key] = value[key];
        }
      }
      server.accounts.put(username, opts.value, logIfError);
    });
  }
  function modifyAccountFromForm(err, body, username, accountOperation) {
    body.admin = !!body.admin; // ie 'true' => true

    var opts = {
      login: {
        basic: {
          username: username,
          password: body.password
        }
      },
      value: {
        admin: body.admin,
        color: randomColor(),
        email: body.email,
        username: username
      }
    };
    accountOperation(opts);
  }
  function renderAccountUpdateForm(res, username, user) {
    server.accounts.get(username, function (err, value) {
      if (err) {
        return console.log(err);
      }
      var ctx = { account: value, editorAccount: user };
      response()
        .html(server.render('account-update', ctx)).pipe(res);
    });
  }

  /*
   *  Create an admin account (admin only)
   */

  server.route(prefix + '/create-admin', function (req, res) {
    server.authorizeSession(req, res, function (error, user, session) {
      if (!user.admin || error) {
        if (error) console.log(error);
        res.writeHead(302, { 'Location': prefix });
        return res.end();
      }
      if (req.method === 'GET') {
        return response()
          .html(server.render('account-new')).pipe(res);
      }
      if (req.method === 'POST') {
        createAccountFromForm(req, res);

        res.writeHead(302, { 'Location': prefix });
        return res.end();
      }
    });
  });

  /*
  *  Create an account
  */

  server.route(prefix + '/create', function (req, res) {
    if (req.method === 'GET') {
      if (res.account) {
        server.getUserBySession(req, function (err, user, session) {
          return response().html(server.render('account-update')).pipe(res);
        });
      }
      else return response()
        .html(server.render('account-new')).pipe(res);
    }

    if (req.method === 'POST') {
      createAccountFromForm(req, res);
      res.writeHead(302, { 'Location': '/' });
      return res.end();
    }
  });

  /*
   * Delete an account (admin only)
   */

  server.route(prefix + '/delete/:username', function (req, res, opts) {
    server.authorizeSession(req, res, function (error, user, session) {
      if (user.admin && !error) {
        if (req.method === 'POST') {
          server.accounts.remove(opts.params.username, logIfError);
          res.writeHead(302, { 'Location': prefix });
          return res.end();
        }
      } else {
        if (error) {
          console.log(error);
        }
        res.writeHead(302, { 'Location': '/' });
        return res.end();
      }
    });
  });

  /*
  * Update an account
  */

  server.route(prefix + '/update/:username', function (req, res, opts) {
    server.authorizeSession(req, res, function (error, user, session) {
      // If authentification fails
      if (error) {
        return logIfError(error);
      }
      if (user.admin) {
        if (req.method === 'POST') {
          updateAccountFromForm(req, res, opts.params);
          res.writeHead(302, {'Location': prefix });
          return res.end();
        }
        if (req.method === 'GET') {
          renderAccountUpdateForm(res, opts.params.username, user)
        }
      } else {
        if (res.account.key !== opts.params.username) {
          return console.log("You must be admin to update an account which is not yours");
        }
        // When we are only changing the current account:
        if (req.method === 'POST' ) {
          updateAccountFromForm(req, res, opts.params);
        }
        if (req.method === 'GET') {
          renderAccountUpdateForm(res, opts.params.username, user)
        }
        res.writeHead(302, {'Location': '/'});
        return res.end();
      }
    });
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

};
