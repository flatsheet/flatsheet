var uuid = require('uuid').v1;
var randomColor = require('random-color');

module.exports = function (handlebars) {
  /*
  * Stringify JSON in a view
  */
  handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
  });

  /*
  * Increment variable
  */
  handlebars.registerHelper('plus1', function(value, options) {
    return parseInt(value) + 1;
  });

  /*
  * Fill in checkbox
  */
  handlebars.registerHelper('checked', function (currentValue) {
    return currentValue == true ? ' checked ' : '';
  });

  /*
   * Return a UUID
   */
  handlebars.registerHelper('getUUID', function () {
    return uuid();
  });

  /*
   * Return a random color
   */
  handlebars.registerHelper('getRandomColor', function () {
    return (randomColor());
  });
}