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
      server.sheets.list()
        .pipe(JSONStream.stringify())
        .pipe(res);
    }


    /*
    *  Create new sheet
    */

    if (req.method === 'POST') {
      jsonBody(req, res, function (err, body) {
        console.log(err, body)
        server.sheets.create(body, function (err, sheet) {
          // todo: set statuscode when create fails

          //todo: require authentication

          if (!sheet) return response.json({ message: 'nope' }).pipe(res);
          else return response.json(sheet).pipe(res);
        });
      });
    }

  });



  server.route(prefix + 'sheets/:id', function (req, res, match) {


    /*
    *  Get individual sheet
    */

    if (req.method === 'GET') {
      server.sheets.fetch(match.params.id, function (err, sheet) {
        // todo: set 404 when no sheet
        if (!sheet) return response.json({ message: 'nope' }).pipe(res);
        return response.json(sheet).pipe(res);
      });
    }


    /*
    *  Update sheet
    */

    if (req.method === 'PUT') {
      server.sheets.update(match.params.id, function (err) {
        // todo: set statuscode when create fails

        //todo: require authentication

        if (!sheet) return response.json({ message: 'nope' }).pipe(res);
      });
    }



    /*
    *  Destroy sheet
    */

    if (req.method === 'DELETE') {
      server.sheets.destroy(match.params.id, function (err) {
        // todo: set statuscode when create fails

        //todo: require authentication

        if (!sheet) return response.json({ message: 'nope' }).pipe(res);
      });
    }
  });

  server.route(prefix + 'sheets/:id/csv', function (req, res, match) {
    //todo
  });
}
