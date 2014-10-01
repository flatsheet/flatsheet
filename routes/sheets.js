var response = require('response');
var JSONStream = require('JSONStream');
var jsonBody = require('body/json');
var formBody = require('body/form');
var socketio = require('socket.io');

exports.install = function (server, prefix) {
  var prefix = prefix || '/sheet';

  server.route(prefix + '/list', function (req, res, opts) {
    server.sheets.list(function (err, list) {
      if (err) console.log(err);
      var ctx = { account: res.account, sheets: list };
      return response().html(server.render('sheet-list', ctx)).pipe(res);
    });
  });

  server.route(prefix + '/edit/:id', function (req, res, opts) {

    if (!res.account) {
      res.writeHead(302, { 'Location': prefix + '/view/' + opts.params.id });
      return res.end();
    }

    server.sheets.fetch(opts.params.id, function (err, sheet) {
      if (err) {
        res.writeHead(302, { 'Location': '/' });
        return res.end();
      }

      var ctx = { account: res.account, sheet: sheet };
      return response().html(server.render('sheet-edit', ctx)).pipe(res);
    });
  });

  server.route(prefix + '/view/:id', function (req, res, opts) {
    server.sheets.fetch(opts.params.id, function (err, sheet) {
      if (err) {
        res.writeHead(302, { 'Location': '/' });
        return res.end();
      }

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
    formBody(req, res, function (err, body) {
      var data = body;
      data.rows = [];
      server.sheets.create(data, function (err, sheet, token) {
        if (err) console.error(err);
        res.writeHead(302, { 'Location': '/sheet/edit/' + token });
        return res.end();
      })
    });
  });
  
  server.route(prefix + '/:id/destroy', function (req, res, opts) {
    if (req.method === 'DELETE') {
      server.sheets.destroy(opts.params.id, function (a, b, c) {
        console.log(a, b, c);
      });
    }
  });
}
