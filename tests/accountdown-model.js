var test = require('tape')
var level = require('level')
var each = require('each-async')
var accountdown = require('accountdown')
var sublevel = require('subleveldown')

function accountdownBasic (db, prefix) {
  return require('accountdown-basic')(db, prefix, { key: 'key' })
}

var accountdown = accountdown(sublevel(db, 'accounts'), {
  login: { basic: accountdownBasic }
})

var accounts = require('./models/accountdown-model')(accountdown, { db: db })

test('', function (t) {
  
})