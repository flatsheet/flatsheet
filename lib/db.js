var path = require('path')
var level = require('level')
var accountdown = require('accountdown')
var cookieAuth = require('cookie-auth')
var sublevel = require('subleveldown')
var formBody = require('body/form')

var sheets = require('../models/sheets')

module.exports = function (flatsheet, cb) {
  var flatsheet = flatsheet || {}

  /*
  * Create leveldb using level
  */
  flatsheet.db = level(path.join(flatsheet.dataDir, 'db'))

  /*
  * Create sublevel for sheets
  */
  flatsheet.sheets = sheets(flatsheet.db)

  /*
  * Create sublevel for sessions using cookie-auth
  */
  flatsheet.auth = cookieAuth({
    name: flatsheet.site.title, 
    sessions: sublevel(flatsheet.db, 'sessions'),
    authenticator: function (req, res, cb) {
      formBody(req, res, function (err, body) {
        flatsheet.accounts.verify('basic', body, function (err, ok, id) {
          if (err) return cb(err)
          if (!ok) return cb(new Error('incorrect password or username'))
          else cb()
        })
      })
    }
  })


  /*
  * Set up accountdown with accountdown-basic for account management
  */
  flatsheet.accounts = require('../models/accounts')(flatsheet.db)

  /*
  * Invites sublevel
  */
  flatsheet.invites = sublevel(flatsheet.db, 'invites', {
    valueEncoding: 'json'
  })

  /*
   * Resets sublevel
   */
  flatsheet.resets = sublevel(flatsheet.db, 'resets', {
    valueEncoding: 'json'
  })

  if (cb) cb()
  return flatsheet
}