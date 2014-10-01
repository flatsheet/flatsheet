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
      jsonBody(req, res, function (err, body) {
        server.sheets.create(body, function (err, sheet) {
          // todo: set statuscode when create fails

          //todo: require authentication

          if (!sheet) return response.json({ message: 'nope' }).pipe(res);
          else return response.json(sheet).pipe(res);
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
        // todo: set 404 when no sheet
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
      jsonBody(req, res, function (err, body) {
        server.sheets.update(opts.params.id, body, function (err, sheet) {
          // todo: require authentication

          if (err || !sheet) {
            var data = { 
              message: 'Something went wrong',
              statusCode: 400
            }
            return response.json(data).status(400).pipe(res);
          }
          
          else return response.json(sheet).pipe(res);
        });
      });
    }



    /*
    *  Destroy sheet
    */

    if (req.method === 'DELETE') {
      server.sheets.destroy(opts.params.id, function (err) {
        //todo: require authentication

        if (err) {
          
          var data = { 
            message: 'Something went wrong',
            statusCode: 400
          }
          return response.json(data).status(400).pipe(res);
        }

        res.writeHead(204);
        return res.end();
      });
    }
  });

  server.route(prefix + 'sheets/:id/csv', function (req, res, match) {
    //todo
  });
}
