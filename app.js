
/*
* This file serves as an example of how you can use flatsheet as a dependency 
* in another project. This is useful in production so you can install
* flatsheet using npm, and pull in the latest version of flatsheet using npm
* instead of pulling and merging changes via git.
*/
var fs = require('fs');
var config = require('./config')

/*
* Create leveldb using level
*/

var dataDir = opts.dataDir || opts.db || path.join(__dirname, 'data')
mkdirp.sync(dataDir)

var db = level(path.join(dataDir, 'db'))

var server = require('./lib/index')(db, config)
server.listen()
