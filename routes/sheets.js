var response = require('response');
var JSONStream = require('JSONStream');
var jsonBody = require('body/json');

exports.install = function (server, prefix) {
  var prefix = prefix || '/sheet';

  server.route(prefix + 's', function (req, res, opts) {
    server.sheets.list(function (err, list) {
      var ctx = { account: res.account, sheets: list };
      return response().html(server.views.sheetlist(ctx)).pipe(res);
    });
  });

  server.route(prefix + '/:id', function (req, res, opts) {
    server.sheets.fetch(opts.params.id, function (err, sheet) {
      var ctx = { account: res.account, sheet: sheet };
      return response().html(server.views.sheet(ctx)).pipe(res);
    });
  });

  server.route(prefix + '/:id/view', function (req, res) {
    // todo
  });
}
