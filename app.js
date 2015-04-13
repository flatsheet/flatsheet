
/*
* This file serves as an example of how you can use flatsheet as a dependency 
* in another project. This is useful in production so you can install
* flatsheet using npm, and pull in the latest version of flatsheet using npm
* instead of pulling and merging changes via git.
*/

var server = require('./lib/index')({
  site: {
    title: 'flatsheet',
    email: 'hi@example.com',
    url: 'http://127.0.0.1:3333',
    contact: 'your full name'
  }
});

server.listen();