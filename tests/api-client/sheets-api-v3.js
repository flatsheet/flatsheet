var test = require('tape')
var request = require('request')
var each = require('each-async')
var JSONStream = require('JSONStream')

var flatsheet = require('flatsheet-api-client')({
  host: 'http://127.0.0.1:3333',
  username: 'pizza',
  password: 'pizza'
})


test('create sheets', function (t) {
  var data = require('../fixtures/sheets.js')
  each(data, iterator, end)

  function iterator (sheet, i, done) {
    flatsheet.sheets.create(sheet, function (err, sheet) {
      t.notOk(err)
      t.ok(sheet)
      done()
    })
  }

  function end () {
    t.end()
  }
})

test('get list of sheets', function (t) {
  flatsheet.sheets.list(function (err, list) {
    t.notOk(err)
    t.ok(list)
    t.end()
  })
})

test('get a sheet', function (t) {
  flatsheet.sheets.list(function (err, list) {
    flatsheet.sheets.get(list[0].key, function (err, sheet) {
      t.notOk(err)
      t.ok(sheet)
      t.end()
    })
  })
})

test('update a sheet', function (t) {
  flatsheet.sheets.list(function (err, list) {
    flatsheet.sheets.get(list[0].key, function (err, sheet) {
      sheet.title = 'weee'
      flatsheet.sheets.update(sheet, function (err, updatedSheet) {
        t.notOk(err)
        t.ok(updatedSheet)
        t.equals(updatedSheet.title, 'weee')
        t.end()
      })
    })
  })
})

test('get rows of a sheet', function (t) {
  flatsheet.sheets.list(function (err, list) {
    flatsheet.sheets.rows(list[0].key, function (err, rows) {
      t.notOk(err)
      t.ok(rows)
      t.end()
    })
  })
})

test('add a row to a sheet', function (t) {
  flatsheet.sheets.list(function (err, list) {
    flatsheet.sheets.rows(list[0].key, function (err, rows) {
      var data = { ok: 'cool' }
      flatsheet.sheets.addRow(list[0].key, data, function (err, row) {
        console.log(err, row)
        t.notOk(err)
        t.ok(row)
        console.log(row)
        t.end()
      })
    })
  })
})

test('get specific row of a sheet', function (t) {
  flatsheet.sheets.list(function (err, list) {
    flatsheet.sheets.rows(list[0].key, function (err, rows) {
      flatsheet.sheets.getRow(list[0].key, rows[0].key, function (err, row) {
        t.notOk(err)
        t.ok(row)
        t.end()
      })
    })
  })
})

test('update row of a sheet', function (t) {
  flatsheet.sheets.list(function (err, list) {
    flatsheet.sheets.rows(list[0].key, function (err, rows) {
      rows[0].value.awesome = true
      flatsheet.sheets.updateRow(list[0].key, rows[0], function (err, row) {
        t.notOk(err)
        t.ok(row)
        console.log(row)
        t.equals(row.value.awesome, true)
        t.end()
      })
    })
  })
})

test('delete row of a sheet', function (t) {
  flatsheet.sheets.list(function (err, list) {
    flatsheet.sheets.rows(list[0].key, function (err, rows) {
      flatsheet.sheets.deleteRow(list[0].key, rows[0], function (err, row) {
        t.notOk(row)
        flatsheet.sheets.getRow(list[0].key, rows[0].key, function (err, row) {
          t.ok(err)
          t.notOk(row)
          t.end()
        })
      })
    })
  })
})

test('teardown', function (t) {
  flatsheet.sheets.list(function (err, list) {
    t.notOk(err)
    t.ok(list)

    function iterator (item, i, next) {
      flatsheet.sheets.delete(item.key, function (err) {
        t.notOk(err)
        next()
      })
    }

    function end () {
      t.end()
    }

    each(list, iterator, end)
  })
})