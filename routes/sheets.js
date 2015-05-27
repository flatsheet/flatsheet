var response = require('response');
var JSONStream = require('JSONStream');
var jsonBody = require('body/json');
var formBody = require('body/form');
var Busboy = require('busboy');
var csv = require('csv-parser');
var Router = require('match-routes');
var each = require('each-async')

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
        data['owners'] = {};
        data.owners[account.username] = true;

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

        server.sheets.create(sheet, function (err, sheet) {
          if (err) console.error(err);
          res.writeHead(302, { 'Location': '/sheets/edit/' + sheet.key });
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

  /*
   * Sheet update helper functions
   */
  // helper functions to determine whether the sheet's attribute needs to be updated
  var isEmpty = function (attribute, body, sheet) {
    return body[attribute] !== '';
  }
  var isChanged = function (attribute, body, sheet) {
    return body[attribute] !== sheet[attribute];
  }
  var isBooleanChanged = function (attribute, body, sheet) {
    return !!body[attribute] !== sheet[attribute];
  }
  // helper functions to perform the sheet attribute update
  var setPermissionsAttribute = function (attribute, body, data, done, opts) {
    var username = body[attribute];
    server.accountsIndexes.getKeyFromUsername(username, function (err, account) {
      // TODO: return flash message if username is invalid or already has permission
      if (err) return console.log("sheets.update: Invalid username:", err);
      data[opts.permission][account.key] = true;
      done();
    })
  }
  var setEditor = function (attribute, body, data, done) {
    setPermissionsAttribute(attribute, body, data, done, { permission: 'editors' });
  }
  var setOwner = function (attribute, body, data, done) {
    setPermissionsAttribute(attribute, body, data, done, { permission: 'owners' });
  }
  var setAttribute = function (attribute, body, data, done) {
    data[attribute] = body[attribute];
    done();
  }
  var setBooleanAttribute = function (attribute, body, data, done) {
    data[attribute] = !!body[attribute];
    done();
  }

  // Returns an object with two functions: bodyNeedsUpdating and updateBody
  // Allows control over asynchronous processing
  var sheetAttributesSettings = {
    'new-editor-permission': {
      bodyNeedsUpdating: isEmpty,
      updateBody: setEditor
    }, 'new-owner-permission': {
      bodyNeedsUpdating: isEmpty,
      updateBody: setOwner
    }, description: {
      bodyNeedsUpdating: isChanged,
      updateBody: setAttribute
    }, name: {
      bodyNeedsUpdating: isChanged,
      updateBody: setAttribute
    }, 'private': {
      bodyNeedsUpdating: isBooleanChanged,
      updateBody: setBooleanAttribute
    }
  }

  router.on(prefix + '/update/:key', function (req, res, opts) {
    permissions.authorize(req, res, function (err, account, session) {
      server.sheets.get(opts.params.key, function (err, sheet) {
        if (err) {
          console.error(err);
          return redirect(res, '/404');
        }

        if (permissions.sheetEditable(sheet, account)) {
          formBody(req, res, function (err, body) {
            if (err) return console.log("Sheet.update: err on formbody parse:", err);
            var data = sheet;
            each(Object.keys(sheetAttributesSettings), function(attribute, _, done) {
              if (sheetAttributesSettings[attribute]['bodyNeedsUpdating'](attribute, body, sheet)) {
                sheetAttributesSettings[attribute]['updateBody'](attribute, body, data, done);
              } else {
                done();
              }
            }, function(err) {
              if (err) console.log("sheets.update: Error while setting attributes:", err);

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
            })
          });
        }
      });
    });
  });

  /*
  * backwards compatibility for old sheet route
  */
  router.on(prefix + '/:key', function (req, res, opts) {
    return redirect(res, prefix + '/edit/' + opts.params.key)
  });

  return router;
};
