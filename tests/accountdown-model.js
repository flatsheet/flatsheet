var test = require('tape')
var level = require('levelup')
var each = require('each-async')
var accountdown = require('accountdown')
var sublevel = require('subleveldown')

var db = level('test', { 
  db: require('memdown'),
  valueEncoding: 'json'
})

function accountdownBasic (db, prefix) {
  return require('accountdown-basic')(db, prefix, { key: 'key' })
}

var accountdown = accountdown(sublevel(db, 'accounts'), {
  login: { basic: accountdownBasic }
})

var accounts = require('../models/accountdown-model')(accountdown, { 
  db: db,
  properties: {
    username: { type: 'string' },
    email: { type: 'string' }
  }
})

test('create accounts', function (t) {
  var data = require('./data/accounts.js')
  each(data, iterator, end)

  function iterator (account, i, done) {
    accounts.create(account, function (err, account) {
      t.notOk(err)
      t.ok(account)
      done()
    })
  }

  function end () {
    t.end()
  }
})