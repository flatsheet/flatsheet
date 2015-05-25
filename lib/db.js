var path = require('path');
var level = require('level');
var accountdown = require('accountdown');
var cookieAuth = require('cookie-auth');
var sublevel = require('subleveldown');
var formBody = require('body/form');
var accountsIndexes = require('./accounts-indexes');

var sheets = require('../models/sheets');

module.exports = function (flatsheet, cb) {
  var flatsheet = flatsheet || {};

  /*
  * Create leveldb using level
  */
  flatsheet.db = level(path.join(flatsheet.dataDir, 'db'));

  /*
  * Create sublevel for sheets
  */
  flatsheet.sheets = sheets(flatsheet.db);

  /*
  * Create sublevel for sessions using cookie-auth
  */
  flatsheet.auth = cookieAuth({
    name: flatsheet.site.title, 
    sessions: sublevel(flatsheet.db, 'sessions'),
    authenticator: function (req, res, cb) {
      formBody(req, res, function (err, body) {
        flatsheet.accountdown.verify('basic', body, function (err, ok, id) {
          if (err) return cb(err);
          if (!ok) return cb(new Error('incorrect password or username'));
          else cb();
        });
      });
    }
  });


  /*
  * Set up accountdown with accountdown-basic for account management
  */
  function accountdownBasic (db, prefix) {
    return require('accountdown-basic')(db, prefix, { key: 'uuid' });
  }
  flatsheet.accountdown = accountdown(sublevel(flatsheet.db, 'accounts'), {
    //login: { basic: require('accountdown-basic')} // Use this when creating test accounts
    login: { basic: accountdownBasic} // Use this when running migration script
  });

  /*
  * Invites sublevel
  */
  flatsheet.invites = sublevel(flatsheet.db, 'invites', {
    valueEncoding: 'json'
  });

  /*
   * Resets sublevel
   */
  flatsheet.resets = sublevel(flatsheet.db, 'resets', {
    valueEncoding: 'json'
  });

  flatsheet.accountsIndexes = accountsIndexes(flatsheet.db, flatsheet.accountdown);

  if (cb) cb();
  return flatsheet;
};