var response = require('response');
var JSONStream = require('JSONStream');
var jsonBody = require('body/json');
var formBody = require('body/form');
var Busboy = require('busboy');
var csv = require('csv-parser');
var Router = require('match-routes');

var redirect = require('../lib/redirect');

module.exports = function (server, prefix) {
  var prefix = prefix || '/sheets';
  var permissions = require('../lib/permissions')(server);
  var router = Router();

  router.on(prefix, function (req, res, opts) {
    permissions.authorizeSession(req, res, function (err, account, session) {
      if (err) redirect(res, '/');

      var renderSheets = function (err, list) {
        if (err) console.log(err);
        var ctx = { account: account, sheets: list };
        return response().html(server.render('sheet-list', ctx)).pipe(res);
      };
      
      if (account.admin) {
        server.sheets.list(renderSheets);
      } else {
        server.sheets.list({ filter: { accessible: account.username }}, renderSheets);
      }
    });
  });

  router.on(prefix + '/edit/:key', function (req, res, opts) {
    permissions.authorize(req, res, function (err, account, session) {
      if (err) return redirect(res, '/view/' + opts.params.key);

      server.sheets.get(opts.params.key, function (err, sheet) {
        if (err) return redirect(res, '/404');
        
        if (permissions.sheetEditable(sheet, account)) {
          var ctx = { account: account, sheet: sheet };
          return response().html(server.render('sheet-edit', ctx)).pipe(res);
        }
        
        return redirect(res, '/view/' + opts.params.key);
      });
    });
  });

  router.on(prefix + '/view/:key', function (req, res, opts) {
    server.getAccountBySession(req, function (err, account, session) {
      server.sheets.get(opts.params.key, function (err, sheet) {
        if (err) return redirect(res, '/404');
        
        if (permissions.sheetAccessible(sheet, account)) {
          var headers = [];

          sheet.rows.forEach(function (row) {
            Object.keys(row).forEach( function (name) {
              if (headers.indexOf(name) < 0) headers.push(name);
            });
          });

          var ctx = { account: account, sheet: sheet, headers: headers };
          return response().html(server.render('sheet-view', ctx)).pipe(res);
        }
        
        return redirect(res, '/404');
      });
    });
  });

  router.on(prefix + '/new', function (req, res, opts) {
    permissions.authorizeSession(req, res, function (err, account, session) {
      if (err) redirect(res, '/');

      formBody(req, res, function (err, body) {
        var data = body;
        data['editors'] = {};
        data['owners'] = {};
        data.owners[account.username] = true;
        data.rows = []

        server.sheets.create(data, function (err, sheet) {
          if (err) console.error(err);
          return redirect(res, '/sheets/edit/' + sheet.key)
        })
      });

    });
  });

  router.on(prefix + '/new/csv', function (req, res, opts) {
    permissions.authorizeSession(req, res, function (err, account, session) {
      if (err) redirect(res, '/');

      var sheet = { rows: [] };

      var busboy = new Busboy({ headers: req.headers });

      busboy.on('file', function (fieldname, file, filename, enc, mime) {
        file.pipe(csv()).on('data', function (data) {
          sheet.rows.push(data);
        });
      });

      busboy.on('field', function(fieldname, val) {
        sheet[fieldname] = val
      });

      busboy.on('finish', function() {
        if (!sheet.name) sheet.name = 'New sheet';
        if (!sheet.description) sheet.description = 'A cool new sheet.';

        server.sheets.create(sheet, function (err, sheet, token) {
          if (err) console.error(err);
          res.writeHead(302, { 'Location': '/sheets/edit/' + token });
          return res.end();
        })
      });

      req.pipe(busboy);
    });
  });

  router.on(prefix + '/destroy/:key', function (req, res, opts) {
    permissions.authorize(req, res, function (err, account, session) {
      if (err) redirect(res, '/');
      
      server.sheets.get(opts.params.key, function (err, sheet) {
        if (err) console.error(err)
        if (permissions.sheetDestroyable(sheet, account)) {
          server.sheets.destroy(opts.params.key, function (err) {
            if (err) console.error(err);
            return redirect(res, '/')
          });
        }
      })
    });
  });


  router.on(prefix + '/update/:key', function (req, res, opts) {
    permissions.authorize(req, res, function (err, account, session) {
      server.sheets.get(opts.params.key, function (err, sheet) {
        if (err) {
          console.error(err);
          return redirect(res, '/404');
        }
        
        if (permissions.sheetEditable(sheet, account)) {
          formBody(req, res, function (err, body) {
            var data = sheet;
            if (body['new-user-permission'] !== '') {
              // TODO: Check whether the new name permission is a duplicate or a valid username
              data.editors[body['new-user-permission']] = true;
            }
            if (body['new-owner-permission'] !== '') {
              // TODO: Check whether the new name permission is a duplicate or a valid username
              data.owners[body['new-owner-permission']] = true;
            }
            if (body['description'] !== sheet.description) {
              data.description = body['description'];
            }
            if (body['name'] !== sheet.name) {
              data.name = body['name'];
            }
            if (!!body['private'] !== sheet.private) {
              data.private = !!body['private'];
            }
            
            data.websites = body.websites.split(/\n\s*/g).map(function (url) {
              if(!/^((http|https):\/\/)/.test(url)) {
                  url = "http://" + url;
              }
              return url.replace(/\r/g, '');
            })

            server.sheets.update(opts.params.key, data, function(err) {
              if (err) console.log(err);
              return redirect(res, '/sheets/edit/' + opts.params.key)
            });
          });
        }
      });
    });
  });

  /*
  * backwards campatibility for old sheet route
  */
  router.on(prefix + '/:key', function (req, res, opts) {
    return redirect(res, prefix + '/edit/' + opts.params.key)
  });
  
  return router;
};
