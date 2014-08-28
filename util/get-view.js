var fs = require('fs');


/*
* helper function for pulling in a handlebars template
*/

module.exports = function (handlebars) {
  return function getView (filename) {
    return handlebars.compile(fs.readFileSync('./views/' + filename + '.html', 'utf8'));
  }
}
