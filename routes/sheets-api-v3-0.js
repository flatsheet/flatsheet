var qs = require('querystring')
var response = require('response');
var JSONStream = require('JSONStream');
var jsonBody = require('body/json');
var Router = require('match-routes');
var CSV = require('comma-separated-values');

module.exports = function (server, prefix) {
  var prefix = prefix || '/api/v3/';
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
    console.log('happening', req.method, req.url)
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


  router.on(prefix + 'sheets/:key/rows', function (req, res, opts) {
    console.log('happening', req.method, req.url)
    if (req.method === 'GET') {
      server.sheets.get(opts.params.key, function (err, sheet) {
        if (sheet && !sheet.isPrivate()) {
          return sheet.dat.createReadStream()
            .pipe(JSONStream.stringify())
            .pipe(res);
        }

        permissions.authorize(req, res, function (err, account) {
          if (permissions.sheetAccessible(sheet, account)) {
            return sheet.dat.createReadStream()
              .pipe(JSONStream.stringify())
              .pipe(res);
          }
          
          return response.json({ message: 'Not found', statusCode: 404 }).status(404).pipe(res);
        });
      })
    }

    if (req.method === 'POST') {
      permissions.authorize(req, res, function (err, account) {
        if (!account) return response().json({ error: 'Unauthorized'}).status(401).pipe(res);

        jsonBody(req, res, function (err, body) {
          server.sheets.get(opts.params.key, function (err, sheet) {
            if (permissions.sheetAccessible(sheet, account)) {
              sheet.addRow(body, function (err, row) {
                if (err) return response().json({ error: 'Error'}).status(500).pipe(res);
                return response().json(row).pipe(res)
              })
            }
          })
        })
      })
    }
  })

  router.on(prefix + 'sheets/:key/rows/:rowkey', function (req, res, opts) {
    if (req.method === 'GET') {
      server.sheets.get(opts.params.key, function (err, sheet) {
        if (err || !sheet) {
          return response.json({ message: 'Sheet not found', statusCode: 404 }).status(404).pipe(res);
        }

        permissions.authorize(req, res, function (err, account) {
          if (permissions.sheetAccessible(sheet, account)) {
            sheet.getRow(opts.params.rowkey, function (err, row) {
              if (err || !row) {
                return response.json({ message: 'Row not found', statusCode: 404 }).status(404).pipe(res);
              }
              return response.json(row).pipe(res)
            })
          }
        });
      })
    }

    if (req.method === 'PUT') {
      permissions.authorize(req, res, function (err, account) {
        if (err) return response().json({ error: 'Unauthorized'}).status(401).pipe(res);

        jsonBody(req, res, function (err, body) {
          server.sheets.get(opts.params.key, function (err, sheet) {
            sheet.updateRow(opts.params.rowkey, body, function (err, row) {
              if (err || !sheet) {
                var data = { message: 'Not found', statusCode: 404 };
                return response.json(data).status(404).pipe(res);
              }

              return response.json(row).pipe(res)
            });
          });
        });
      });
    }

    if (req.method === 'DELETE') {
      permissions.authorize(req, res, function (err, account) {
        if (err) return response().json({ error: 'Unauthorized'}).status(401).pipe(res);

        server.sheets.get(opts.params.key, function (err, sheet) {
          sheet.deleteRow(opts.params.rowkey, function (err) {
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
  })

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