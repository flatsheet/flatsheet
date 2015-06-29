var test = require('tape')
var fs = require('fs');
var each = require('each-async')
var hammock = require('hammock')
var config = require('../../config.js');

var MemDB = require('memdb');
var db = MemDB();
var flatsheet = require('../../lib/index.js')(db, config);

var accountsApiHandler = require('../../handlers/accounts-api')(flatsheet)

// Make a request to get the initial token
var request = hammock.Request({
  method: 'GET',
  headers: {
    //'content-type': 'application/x-www-form-urlencoded'
    'content-type': 'application/json'
  },
  url: '/somewhere'
})
request.end()
var response = hammock.Response()
var payload = { username: "joeblow" }
var token = flatsheet.tokens.sign(request, response, payload)

test('retrieve a list of accounts', function (t) {
  t.plan(9)
  var data = require('./../fixtures/accounts')
  each(data, iterator, end)

  function iterator (account, i, done) {
    flatsheet.accounts.create(account, function (err, created) {
      t.notOk(err)
      t.ok(created)
      done()
    })
  }

  function end () {

    console.log("\n\n\ntest: getting accounts")

    request = hammock.Request({
      method: 'GET',
      headers: {
        'content-type': 'application/json'
      },
      url: '/somewhere'
    })
    request.method = 'GET'
    request.headers.Authorization = 'Bearer ' + token
    request.end()

    response = hammock.Response()
    console.log("Req.headers:", request.headers)
    var accounts = accountsApiHandler.accounts(request, response) // without a callback, accounts is `undefined`
    console.log("test.accountsApiHandler: accountsApiHandler.accounts: accounts", accounts)
    //console.log("test.accountsApiHandler: accountsApiHandler.accounts: response.body", response.body) // undefined

    var results = []
    response// just an empty stream...
      .on('data', function (data) {
        results.push(data)
      })
      .on('error', function (err) {
        t.fail(err)
      })
      .on('end', function () {
        console.log("results:", results)
        t.ok(results)
      })

    //accountsApiHandler.accounts(request, response, function (returnedResponse) {
    //
    //  console.log("test.accountsApiHandler: accountsApiHandler.accounts returned response:", returnedResponse)
    //  console.log("test.accountsApiHandler: accountsApiHandler.accounts response stream:", returnedResponse.createReadStream())
    //  var results = []
    //  returnedResponse.createReadStream()
    //    .on('data', function (data) {
    //      results.push(data)
    //    })
    //    .on('error', function (err) {
    //      t.fail(err)
    //    })
    //    .on('end', function () {
    //      //var ctx = { accounts: results, account: account }
    //      //return response().html(self.server.render('account-list', ctx)).pipe(res)
    //      console.log("results:", results)
    //      t.ok(results)
    //    })
    //})
//})

  }
})
