var response = require('response');
var JSONStream = require('JSONStream');
var jsonBody = require('body/json');

exports.install = function (server, prefix) {
  var prefix = prefix || '/api/v2/';

  server.route(prefix + 'sheets', function (req, res, match) {
    if (req.headers.authorization) {
      var cred = req.headers.authorization.split(':');
      var account = { username: cred[0], password: cred[1] };
    }
    
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
      if (!cred) {
        var data = { message: 'Forbidden', statusCode: 403 }
        return response.json(data).status(403).pipe(res);
      }
      
      server.accounts.verify('basic', account, function (err, ok) {
        if (err || !ok) {
          var data = { message: 'Forbidden', statusCode: 403 }
          return response.json(data).status(403).pipe(res);
        }
        
        jsonBody(req, res, function (err, body) {
          server.sheets.create(body, function (err, sheet) {
            console.log('woooooooooooo', account, ok)
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
    if (req.headers.authorization) {
      var cred = req.headers.authorization.split(':');
      var account = { username: cred[0], password: cred[1] };
    }

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
      if (!cred) {
        var data = { message: 'Forbidden', statusCode: 403 }
        return response.json(data).status(403).pipe(res);
      }
      
      server.accounts.verify('basic', account, function (err, ok) {
        if (err || !ok) {
          var data = { message: 'Forbidden', statusCode: 403 }
          return response.json(data).status(403).pipe(res);
        }
        
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
      if (!cred) {
        var data = { message: 'Forbidden', statusCode: 403 }
        return response.json(data).status(403).pipe(res);
      }
      
      server.accounts.verify('basic', account, function (err, ok) {
        if (err || !ok) {
          var data = { message: 'Forbidden', statusCode: 403 }
          return response.json(data).status(403).pipe(res);
        }
      
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
