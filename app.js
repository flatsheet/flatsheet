
/*
* This file serves as an example of how you can use flatsheet as a dependency 
* in another project. This is useful in production so you can install
* flatsheet using npm, and pull in the latest version of flatsheet using npm
* instead of pulling and merging changes via git.
*/
var fs = require('fs');
var config = require('./config')

var server = require('./lib/index')(config, function() {
  server.listen()
})
