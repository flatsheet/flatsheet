var qs = require('querystring')
var url = require('url');
var response = require('response');
var JSONStream = require('JSONStream');
var formBody = require('body/form');
var randomColor = require('random-color');
var uuid = require('uuid').v1;

exports.install = function (server, prefix) {
  var prefix = prefix || '/accounts';

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
            console.log("ctx in accounts list:");
            console.log(ctx);
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
   * Utility functions
   */
  function generateUUID(){
    var d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
  }
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
  function modifyAccountFromForm(err, body, accountOperation) {
    body.admin = !!body.admin; // ie 'true' => true

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
        color: randomColor(),
        admin: body.admin
      }
    };
    accountOperation(body.username, opts, logIfError);
  }

  function createAccount(username, opts, cb) {
    // TODO: fix bug: Once an account is deleted, the username is not available for a new account
    //server.accounts.create(body.username, opts, logIfError);
    //server.accounts.create(username, opts, cb);
    server.accounts.create(generateUUID(), opts, cb);
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
        formBody(req, res, function(err, body) {
          modifyAccountFromForm(err, body, createAccount);
        });
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
      formBody(req, res, function(err, body) {
        modifyAccountFromForm(err, body, createAccount);
      });
      res.writeHead(302, { 'Location': '/' });
      return res.end();
    }
  });

  /*
   * Delete an account (admin only)
   */

  server.route(prefix + '/delete/:id', function (req, res, opts) {
    server.authorizeSession(req, res, function (error, user, session) {
      if (user.admin && !error) {
        if (req.method === 'POST') {
          server.accounts.remove(opts.params.id, function(err) {
            return console.log(err);
          });
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
   * functions for updating an account
   */

  // TODO: Refactor this into 'modifyAccountFromForm'
  function updateAccountFromForm(err, body, params) {
    console.log("opts.params:");
    console.log(params);
    console.log("form body:");
    console.log(body);
    if (err) console.log(err);

    console.log("Updating the account with form info...");

    body.admin = !!body.admin; // ie 'true' => true
    var opts = {
      login: {
        basic: {
          username: body.username,
          password: body.password // not defined
        }
      },
      value: {
        email: body.email,
        username: body.username,
        admin: body.admin
      }
    };

    console.log("getting account value...");
    server.accounts.get(params.username, function(err, value) {
      for (var key in value) {
        if (value.hasOwnProperty(key) && !opts.value.hasOwnProperty(key)) {
          opts.value[key] = value[key];
        }
      }
      console.log("value:");
      console.log(value);

      server.accounts.put(params.id, opts.value, logIfError);
    });
  }
  function renderAccountUpdate(err, value, user, opts, res) {
    var ctx = {account: value, isAdmin: user.admin, id: opts.params.id};
    console.log("\nctx:");
    console.log(ctx);
    response()
      .html(server.render('account-update', ctx)).pipe(res);
  }

  /*
  * Update an account
  */

  server.route(prefix + '/update/:id', function (req, res, opts) {
    // When we are only changing the current account:
    if (req.method === 'POST' && res.account.key === opts.params.id) {
      console.log("Updating the accounts with server.accounts.update(..)");
      // TODO: What is this 'update' method?
      server.accounts.update(body.username, {}, logIfError);
    }
    server.authorizeSession(req, res, function (error, user, session) {
      if (user.admin && !error) {
        if (req.method === 'POST') {
          console.log("\n\nupdating the account:");
          console.log(opts.params.id);
          formBody(req, res, function (err, body) {
            updateAccountFromForm(err, body, opts.params);
          });
          res.writeHead(302, {'Location': prefix });
          return res.end();
        }
        if (req.method === 'GET') {
          console.log("user:");
          console.log(user);
          server.accounts.get(opts.params.id, function (err, value) {
            console.log("value:");
            console.log(value);
            renderAccountUpdate(err, value, user, opts, res);
          });

        }
      } else {
        // If authorization fails:
        if (error) {
          console.log(error);
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

}
