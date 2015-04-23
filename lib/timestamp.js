var moment = require('moment');

module.exports = function timestamp (minimum) {
  var now = moment()
  return { human: now.format('h:mm a, MMM DD, YYYY'), unix: now.unix() }
}