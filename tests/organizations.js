var test = require('tape')
var each = require('each-async')
var levelup = require('levelup')
var db = levelup('db', { db: require('memdown') })
var organizations = require('../models/organizations')(db)

test('create organizations', function (t) {
  var data = require('./fixtures/organizations')
  each(data, iterator, end)

  function iterator (org, i, done) {
    organizations.create(org, function (err, created) {
      t.notOk(err)
      t.ok(created)
      done()
    })
  }

  function end () {
    t.end()
  }
})

test('get and update and organization', function (t) {
  organizations.findOne('name', 'Code for Pizza', function (err, org) {
    t.notOk(err)
    t.ok(org)
    t.equals(org.name, 'Code for Pizza')
    t.end()
  })
})

test('delete organizations', function (t) {
  organizations.createReadStream()
    .on('data', function (data) {
      organizations.delete(data.key, function (err) {
        t.notOk(err)
      })
    })
    .on('end', function () {
      t.end()
    })
})