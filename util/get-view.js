var fs = require('fs');


/*
* helper function for pulling in a handlebars template
*/

module.exports = function (handlebars) {
  return function getView (filepath) {
    return handlebars.compile(fs.readFileSync(filepath, 'utf8'));
  }
}
