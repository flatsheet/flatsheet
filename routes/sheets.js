var response = require('response');
var JSONStream = require('JSONStream');
var jsonBody = require('body/json');
var socketio = require('socket.io');

exports.install = function (server, prefix) {
  var prefix = prefix || '/sheet';

  server.route(prefix + '/list', function (req, res, opts) {
    server.sheets.list(function (err, list) {
      var ctx = { account: res.account, sheets: list };
      return response().html(server.render('sheet-list', ctx)).pipe(res);
    });
  });

  server.route(prefix + '/edit/:id', function (req, res, opts) {

    if (!res.account) {
      res.writeHead(302, { 'Location': prefix + '/view/' + opts.params.id });
      res.end();
      return;
    }

    server.sheets.fetch(opts.params.id, function (err, sheet) {

      var io = socketio(server.server);

      io.on('connection', function (socket) {

        socket.on('change', function (change, rows) {
          socket.broadcast.emit('change', change);
          sheet.rows = rows
          server.sheets.update(opts.params.id, sheet, function (err) {
            if (err) console.error(err);
          });
        });

        socket.on('cell-focus', function (cell) {
          io.emit('cell-focus', cell, res.account.color);
        });

        socket.on('cell-blur', function (cell) {
          io.emit('cell-blur', cell);
        });

        io.on('disconnect', function () {
          io.emit('cell-blur');
        });
      });

      var ctx = { account: res.account, sheet: sheet };
      return response().html(server.render('sheet-edit', ctx)).pipe(res);
    });
  });

  server.route(prefix + '/view/:id', function (req, res, opts) {
    server.sheets.fetch(opts.params.id, function (err, sheet) {

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
}
