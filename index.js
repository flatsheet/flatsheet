var response = require('response');
var config = require('./config');
var server = require('./server')(config);


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
    res.writeHead(302, { 'Location': '/sheet/list' });
    res.end();
  }
});


/*
* Start the server
*/

server.listen((process.env.PORT || 3333), function () {
  console.log('server started at 127.0.0.1:' + (process.env.PORT || 3333));
});
