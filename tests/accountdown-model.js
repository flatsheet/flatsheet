var test = require('tape')
var level = require('levelup')
var each = require('each-async')
var accountdown = require('accountdown')
var sublevel = require('subleveldown')

var db = level('test', { db: require('memdown') })

function accountdownBasic (db, prefix) {
  return require('accountdown-basic')(db, prefix, { key: 'key' })
}

var accountdown = accountdown(sublevel(db, 'accounts'), {
  login: { basic: accountdownBasic }
})

var accounts = require('../models/accountdown-model')(accountdown, { db: db })

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

test('find account by username', function (t) {
  accounts.findOne('pizza', function (err, account) {
    t.ok(account)
    t.equals(account.username, 'pizza')
    t.end()
  })
})

test('find account by email', function (t) {
  accounts.findOne('poop@example.com', function (err, account) {
    t.ok(account)
    t.equals(account.email, 'poop@example.com')
    t.end()
  })
})

test('change password', function (t) {
  accounts.findOne('pizza', function (err, account) {
    accounts.changePassword(account.key, 'butts', function (err) {
      t.notOk(err)
      accounts.verify('basic', { key: account.key, password: 'butts'}, function (err, ok, key) {
        t.notOk(err)
        t.ok(ok)
        t.equals(key, account.key)
        t.end()
      })
    })
  })
})

test('change username', function (t) {
  accounts.findOne('poop', function (err, account) {
    accounts.changeUsername(account.key, 'pee', function (err, updated) {
      t.notOk(err)
      t.ok(updated)
      t.equals(updated.username, 'pee')
      accounts.findOne('pee', function (err, found) {
        t.notOk(err)
        t.ok(found)
        t.equals(found.key, account.key)
        t.end()
      })
    })
  })
})