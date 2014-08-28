var response = require('response');

var Server = require('./server');
var apiV2 = require('./routes/api-v2');
var sheets = require('./routes/sheets');
var accounts = require('./routes/accounts');
var sessions = require('./routes/sessions');

var server = module.exports = new Server();


/*
* Set up the routes of the app
*/

apiV2.install(server);
sheets.install(server);
accounts.install(server);
sessions.install(server);


/*
* Create the root route
*/

server.route('/', function (req, res) {
  if (!res.account) {
    return response()
      .html(server.render('index', {
        account: { username: 'friend' }
      }))
      .pipe(res);
  }
  else {
    res.writeHead(302, { 'Location': '/sheets' });
    res.end();
  }
});


/*
* Start the server
*/

server.listen(3333, function () {
  console.log('server started at 127.0.0.1:3333');
});
