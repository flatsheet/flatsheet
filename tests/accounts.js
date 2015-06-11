var test = require('tape')
var each = require('each-async')
var levelup = require('levelup')
var db = levelup('db', { db: require('memdown') })
var accounts = require('../models/accounts')(db)

test('create accounts', function (t) {
  var data = require('./fixtures/accounts')
  each(data, iterator, end)

  function iterator (account, i, done) {
    accounts.create(account, function (err, created) {
      t.notOk(err)
      t.ok(created)
      done()
    })
  }

  function end () {
    t.end()
  }
})

test('get and update a account', function (t) {
  accounts.findOne('example', function (err, account) {
    t.notOk(err)
    t.ok(account)
    t.equals(account.username, 'example')
    t.end()
  })
})

test('delete accounts', function (t) {
  accounts.createReadStream()
    .on('data', function (data) {
      accounts.delete(data.key, function (err) {
        t.notOk(err)
      })
    })
    .on('end', function () {
      t.end()
    })
})