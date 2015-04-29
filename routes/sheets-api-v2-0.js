var qs = require('querystring')
var response = require('response');
var JSONStream = require('JSONStream');
var jsonBody = require('body/json');
var Router = require('match-routes');
var CSV = require('comma-separated-values');

module.exports = function (server, prefix) {
  var prefix = prefix || '/api/v2/';
  var permissions = require('../lib/permissions')(server);
  var router = Router();

  router.on(prefix + 'sheets', function (req, res, opts) {

    /*
     *  Get list of sheets
     */

    if (req.method === 'GET') {
      var query = qs.parse(opts.parsedUrl.query)
      res.setHeader('Content-Type', 'application/json');
      permissions.authorize(req, res, function (err, account) {
        if (err || !account) {
          return server.sheets.list({ filter: { private: false }})
            .pipe(JSONStream.stringify())
            .pipe(res);
        }

        if (account.admin) {
          return server.sheets.list()
            .pipe(JSONStream.stringify())
            .pipe(res);
        }

        return server.sheets.list({ filter: { accessible: account.username }})
          .pipe(JSONStream.stringify())
          .pipe(res);
      })
    }

    /*
     *  Create new sheet
     */

    if (req.method === 'POST') {
      permissions.authorize(req, res, function (err, account) {
        if (err) return response().json({ error: 'Unauthorized'}).status(401).pipe(res);

        jsonBody(req, res, function (err, body) {
          server.sheets.create(body, function (err, sheet) {
            if (err || !sheet) {
              var data = { message: 'Not found', statusCode: 404 };
              return response.json(data).status(404).pipe(res);
            }

            return sheet.createReadStream().pipe(res);
          });
        });
      });
    }

  });



  router.on(prefix + 'sheets/:key', function (req, res, opts) {

    /*
     *  Get individual sheet
     */

    if (req.method === 'GET') {
      server.sheets.get(opts.params.key, function (err, sheet) {
        if (sheet && !sheet.isPrivate()) {
          return sheet.createReadStream().pipe(res);
        }

        permissions.authorize(req, res, function (err, account) {
          if (permissions.sheetAccessible(sheet, account)) {
            return sheet.createReadStream().pipe(res);
          }
          
          return response.json({ message: 'Not found', statusCode: 404 }).status(404).pipe(res);
        });
      });
    }


    /*
     *  Update sheet
     */

    if (req.method === 'PUT') {
      permissions.authorize(req, res, function (err, account) {
        if (err) return response().json({ error: 'Unauthorized'}).status(401).pipe(res);

        jsonBody(req, res, function (err, body) {
          server.sheets.get(body.key, function (err, sheet) {
            console.log('waaaaaaaaaaaaaaaaaaa', body)
            sheet.update(body, function (err) {
              if (err || !sheet) {
                var data = { message: 'Not found', statusCode: 404 };
                return response.json(data).status(404).pipe(res);
              }

              return sheet.createReadStream().pipe(res);
            });
          });
        });
      });
    }



    /*
     *  Destroy sheet
     */

    if (req.method === 'DELETE') {
      permissions.authorize(req, res, function (err, account) {
        if (err) return response().json({ error: 'Unauthorized'}).status(401).pipe(res);

        server.sheets.get(opts.params.key, function (err, sheet) {
          sheet.destroy(function (err) {
            if (err) {
              var data = { message: 'Server error', statusCode: 500 };
              return response.json(data).status(500).pipe(res);
            }

            res.writeHead(204);
            return res.end();
          });
        });
      });
    }
  });

  router.on(prefix + 'sheets/:key/csv', function (req, res, opts) {
    permissions.authorize(req, res, function (err, account) {
      server.sheets.get(opts.params.key, function (err, sheet) {
        
        if (permissions.sheetAccessible(sheet, account)) {
          var csv = new CSV(sheet.rows, {header:true}).encode()
          return response().txt(csv).pipe(res)
        }

        return response.json({ message: 'Not found', statusCode: 404 }).status(404).pipe(res);
      });
    });
  });

  return router;
};

/*
 * Helper functions
 */

function filterSheetDetails () {
  return through.obj(function iterator(chunk, enc, next) {
    this.push(filter(chunk, ['*', '!editors', '!owners']));
    next();
  });
}