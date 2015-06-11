var test = require('tape')
var each = require('each-async')
var levelup = require('levelup')
var db = levelup('db', { db: require('memdown') })
var profiles = require('../models/profiles')(db)

test('create profiles', function (t) {
  var data = require('./fixtures/profiles')
  each(data, iterator, end)

  function iterator (profile, i, done) {
    profiles.create(profile, function (err, created) {
      t.notOk(err)
      t.ok(created)
      done()
    })
  }

  function end () {
    t.end()
  }
})

test('get and update a profile', function (t) {
  profiles.findOne('username', 'example', function (err, profile) {
    t.notOk(err)
    t.ok(profile)
    t.equals(profile.username, 'example')
    t.end()
  })
})

test('delete profiles', function (t) {
  profiles.createReadStream()
    .on('data', function (data) {
      profiles.delete(data.key, function (err) {
        t.notOk(err)
      })
    })
    .on('end', function () {
      t.end()
    })
})