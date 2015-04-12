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
}