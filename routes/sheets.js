var response = require('response');
var JSONStream = require('JSONStream');
var jsonBody = require('body/json');
var formBody = require('body/form');
var Busboy = require('busboy');
var csv = require('csv-parser');

var redirect = require('../lib/redirect');

exports.install = function (server, prefix) {
  var prefix = prefix || '/sheets';

  server.route(prefix, function (req, res, opts) {
    server.authorizeSession(req, res, function (err, user, session) {
      if (err) redirect(res, '/');

      var renderSheets = function (err, list) {
        if (err) console.log(err);
        var ctx = { account: res.account, sheets: list };
        return response().html(server.render('sheet-list', ctx)).pipe(res);
      };
      if (user.admin) {
        server.sheets.list(renderSheets);
      } else {
        server.sheets.listAccessible(user.username, renderSheets);
      }
    });
  });

  server.route(prefix + '/edit/:id', function (req, res, opts) {
    server.authorizeSession(req, res, function (err, user, session) {
      if (err) return redirect(res, '/');

      server.sheets.fetch(opts.params.id, function (err, sheet) {
        if (err) return redirect(res, '/404');

        var ctx = { account: res.account, sheet: sheet };
        return response().html(server.render('sheet-edit', ctx)).pipe(res);
      });
    });
  });

  server.route(prefix + '/view/:id', function (req, res, opts) {
    server.sheets.fetch(opts.params.id, function (err, sheet) {
      if (err) redirect(res, '/404');

      var headers = [];

      sheet.rows.forEach(function (row) {
        Object.keys(row).forEach( function (name) {
          if (headers.indexOf(name) < 0) headers.push(name);
        });
      });

      var ctx = { account: res.account, sheet: sheet, headers: headers };
      return response().html(server.render('sheet-view', ctx)).pipe(res);
    });
  });

  server.route(prefix + '/new', function (req, res, opts) {
    server.authorizeSession(req, res, function (err, user, session) {
      if (err) redirect(res, '/');

      formBody(req, res, function (err, body) {
        var data = body;
        data['accessible_by'] = {};
        data.accessible_by[user.username] = true;

        data.rows =
          server.sheets.create(data, function (err, sheet, token) {
            if (err) console.error(err);
            res.writeHead(302, { 'Location': '/sheets/edit/' + token });
            return res.end();
          })
      });

    });
  });

  server.route(prefix + '/new/csv', function (req, res, opts) {
    server.authorizeSession(req, res, function (err, user, session) {
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

  server.route(prefix + '/destroy/:id', function (req, res, opts) {
    server.authorizeSession(req, res, function (err, user, session) {
      if (err) redirect(res, '/');

      server.sheets.destroy(opts.params.id, function (err) {
        if (err) console.error(err);
        res.writeHead(302, { 'Location': '/' });
        return res.end();
      });
    });
  });


  server.route(prefix + '/update/:id', function (req, res, opts) {
    server.sheets.fetch(opts.params.id, function (err, sheet) {
      if (err) {
        console.error(err);
        return redirect(res, '/404');
      }

      formBody(req, res, function (err, body) {
        var data = sheet;
        if (body['new-user-permission'] !== '') {
          // TODO: Check whether the new name permission is a duplicate or a valid username
          data.accessible_by[body['new-user-permission']] = true;
        }
        if (body['description'] !== sheet.description) {
          data.description = body['description'];
        }
        if (body['name'] !== sheet.name) {
          data.name = body['name'];
        }

        server.sheets.update(opts.params.id, data, function(err) {
          if (err) console.log(err);
          res.writeHead(302, { 'Location': '/sheets/edit/' + opts.params.id });
          return res.end();
        });
      });

    });
  });

  server.route('/404', function (req, res, opts) {
    return response().html(server.render('404')).pipe(res);
  });

  /*
   * backwards campatibility for old sheet route
   */

  server.route(prefix + '/:id', function (req, res, opts) {
    res.writeHead(302, { 'Location': prefix + '/edit/' + opts.params.id });
    return res.end();
  });
};


