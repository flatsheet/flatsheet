var response = require('response');
var JSONStream = require('JSONStream');
var jsonBody = require('body/json');
var socketio = require('socket.io');

exports.install = function (server, prefix) {
  var prefix = prefix || '/sheet';

  server.route(prefix + 's', function (req, res, opts) {
    server.sheets.list(function (err, list) {
      var ctx = { account: res.account, sheets: list };
      return response().html(server.render('sheet-list', ctx)).pipe(res);
    });
  });

  server.route(prefix + '/edit/:id', function (req, res, opts) {

    if (!res.account) {
      res.writeHead(302, { 'Location': '/' });
      res.end();
      return;
    }

    // ouch, this server.server thing is wonky.
    var io = socketio(server.server);

    io.on('connection', function (socket) {

      socket.on('change', function (keypath, value) {
        socket.broadcast.emit('change', keypath, value);
      });

      socket.on('cell-focus', function (cell) {
        console.log('focused!', res.account.color)
        io.emit('cell-focus', cell, res.account.color);
      });

      socket.on('cell-blur', function (cell) {
        io.emit('cell-blur', cell);
      });

      io.on('disconnect', function () {
        io.emit('cell-blur');
      });
    });

    server.sheets.fetch(opts.params.id, function (err, sheet) {
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
