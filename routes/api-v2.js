var response = require('response');
var JSONStream = require('JSONStream');
var jsonBody = require('body/json');

exports.install = function (server, prefix) {
  var prefix = prefix || '/api/v2/';

  server.route(prefix + 'sheets', function (req, res, match) {

    /*
    *  Get list of sheets
    */

    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      server.sheets.list()
        .pipe(JSONStream.stringify())
        .pipe(res);
    }


    /*
    *  Create new sheet
    */

    if (req.method === 'POST') {
      server.authorizeAPI(req, res, function (err, user, session) {
        if (err) response().json({ error: 'Unauthorized'}).status(401).pipe(res);
        
        jsonBody(req, res, function (err, body) {
          server.sheets.create(body, function (err, sheet) {
            if (err || !sheet) {
              var data = { message: 'Not found', statusCode: 404 };
              return response.json(data).status(404).pipe(res);
            }

            else return response.json(sheet).pipe(res);
          });
        });
      });
    }

  });



  server.route(prefix + 'sheets/:id', function (req, res, opts) {

    /*
    *  Get individual sheet
    */

    if (req.method === 'GET') {
      server.sheets.get(opts.params.id, function (err, sheet) {
        if (!sheet) {
          var data = { 
            message: 'Not found',
            statusCode: 404
          }

          return response.json(data).status(404).pipe(res);
        }
        return response.json(sheet).pipe(res);
      });
    }


    /*
    *  Update sheet
    */

    if (req.method === 'PUT') {
      server.authorizeAPI(req, res, function (err, user, session) {
        if (err) response().json({ error: 'Unauthorized'}).status(401).pipe(res);
        
        jsonBody(req, res, function (err, body) {
          server.sheets.update(opts.params.id, body, function (err, sheet) {
            if (err || !sheet) {
              var data = { message: 'Not found', statusCode: 404 };
              return response.json(data).status(404).pipe(res);
            }
            
            else return response.json(sheet).pipe(res);
          });
        });
      });
    }



    /*
    *  Destroy sheet
    */

    if (req.method === 'DELETE') {
      server.authorizeAPI(req, res, function (err, user, session) {
        if (err) response().json({ error: 'Unauthorized'}).status(401).pipe(res);

        server.sheets.destroy(opts.params.id, function (err) {
          if (err) {
            var data = { message: 'Server error', statusCode: 500 };
            return response.json(data).status(500).pipe(res);
          }

          res.writeHead(204);
          return res.end();
        });
      });
    }
  });

  server.route(prefix + 'sheets/:id/csv', function (req, res, match) {
    //todo
  });
}
