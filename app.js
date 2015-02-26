
/*
* This file serves as an example of how you can use flatsheet as a dependency 
* in another project. This is useful in production so you can install
* flatsheet using npm, and pull in the latest version of flatsheet using npm
* instead of pulling and merging changes via git.
*/

var response = require('response');
var server = require('./lib/index')({
  site: {
    title: 'flatsheet',
    email: 'hi@example.com',
    url: 'http://127.0.0.1:3333',
    contact: 'your full name'
  }
});

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

server.listen((process.env.PORT || 3333), function () {
  console.log('server started at 127.0.0.1:' + (process.env.PORT || 3333));
});