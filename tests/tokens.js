var test = require('tape')
var path = require('path');
var fs = require('fs');
var dotenv = require('dotenv');
var each = require('each-async')
var levelup = require('levelup')
var db = levelup('db', { db: require('memdown') })
var hammock = require('hammock')

var envFilePath = path.join(process.cwd(), '.env');
var envFile = fs.readFileSync(envFilePath);
var secrets = dotenv.parse(envFile);

var tokens = require('../lib/tokens')({ secret: secrets.SECRET_TOKEN })

var request
var response
var token

test('sign in receive token', function (t) {
  t.plan(1)

  request = hammock.Request({
    method: 'GET',
    headers: {
      'content-type': 'application/json'
    },
    url: '/somewhere'
  })
  response = hammock.Response()
  var payload = { username: "joeblow" }

  token = tokens.sign(request, response, payload)
  t.ok(token)
})

test('verify token', function (t) {
  t.plan(2)

  request = hammock.Request({
    method: 'GET',
    headers: {
      'content-type': 'application/json'
    },
    url: '/somewhere'
  })
  response = hammock.Response()
  request.headers.Authorization = "Bearer " + token

  tokens.verify(request, function(err, decoded) {
    t.ifError(err)
    t.ok(decoded)
  })
})

test('test token fail', function (t) {
  t.plan(2)

  request = hammock.Request({
    method: 'GET',
    headers: {
      'content-type': 'application/json'
    },
    url: '/somewhere'
  })
  response = hammock.Response()
  request.headers.Authorization = 'randomInvalidToken!'

  tokens.verify(request, function(err, decoded) {
    t.notOk(decoded)
    t.ok(err)
  })
})
