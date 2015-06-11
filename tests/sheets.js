var test = require('tape')
var each = require('each-async')
var JSONStream = require('JSONStream')
var levelup = require('levelup')
var db = levelup('db', { db: require('memdown') })
var sheets = require('../models/sheets')(db)

test('create sheets', function (t) {
  var data = require('./fixtures/sheets.js')
  each(data, iterator, end)

  function iterator (sheet, i, done) {
    sheets.create(sheet, function (err, sheet) {
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
  sheets.list(function (err, list) {
    t.notOk(err)
    t.ok(list)
    t.end()
  })
})

test('get sheets by owners index', function (t) {
  sheets.list({filter: {owners: 'pizzamaker'}}, function (err, list) {
    t.notOk(err)
    t.ok(list)
    t.equal(1, list.length)
    t.end()
  })
})

test('get sheets by editors index', function (t) {
  sheets.list({filter: {editors: 'eater'}}, function (err, list) {
    t.notOk(err)
    t.ok(list)
    t.equal(list.length, 4)
    t.end()
  })
})

test('get sheets by categories index', function (t) {
  sheets.list({filter: {categories: 'drink'}}, function (err, list) {
    t.notOk(err)
    t.ok(list)
    t.equal(list.length, 1)
    t.end()
  })
})

test('get sheets by organization index', function (t) {
  sheets.list({filter: {organization: 'awesome'}}, function (err, list) {
    t.notOk(err)
    t.ok(list)
    t.equal(list.length, 3)
    t.end()
  })
})

test('get sheets by private index', function (t) {
  sheets.list({filter: {private: true}}, function (err, list) {
    t.notOk(err)
    t.ok(list)
    t.equal(list.length, 4)
    t.end()
  })
})

test('get sheets by accessible index', function (t) {
  sheets.list({filter: {accessible: 'pizzamaker'}}, function (err, list) {
    t.notOk(err)
    t.ok(list)
    t.equal(list.length, 2)
    t.end()
  })
})

test('sheet.dat can store data', function (t) {
  sheets.list(function (err, list) {
    sheets.get(list[0].key, function (err, sheet) {
      sheet.dat.put('hello', { message: 'world' }, function (err) {
        t.notOk(err)
        sheet.dat.get('hello', function (err, row) {
          t.notOk(err)
          t.equal(row.value.message, 'world')
          t.end();
        })
      })
    })
  })
})

test('sheet.createReadStream', function (t) {
  sheets.list(function (err, list) {
    sheets.get(list[0].key, function (err, sheet) {
      sheet.createReadStream().pipe(JSONStream.parse())
        .on('data', function (data) {
          t.ok(data)
        })
        .on('end', function () {
          t.end()
        })
    })
  })
})

test('sheet.rows', function (t) {
  sheets.list(function (err, list) {
    sheets.get(list[0].key, function (err, sheet) {
      sheet.rows(function (err, rows) {
        t.notOk(err)
        t.ok(rows)
        t.end()
      })
    })
  })
})

test('sheet.addRows', function (t) {
  sheets.list(function (err, list) {
    sheets.get(list[0].key, function (err, sheet) {
      var rows = [
        {weee: 'a', ok: 'a'},
        {weee: 'b', ok: 'b'},
        {weee: 'c', ok: 'c'}
      ]

      sheet.rows(function (err, allRows) {
        sheet.addRows(rows, function () {
          sheet.rows(function (err, allRows) {
            t.end()
          })
        })
      })
    })
  })
})

test('create a sheet', function (t) {
  var data = {
    name: 'example',
    description: 'a really great sheet',
    project: 'health',
    categories: ['healthy', 'food'],
    websites: ['http://example.com'],
    owners: { nutrionist: true },
    editors: { eater: true },
    private: false,
    rows: [
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' }
    ]
  };

  sheets.create(data, function (err, sheet) {
    t.notOk(err)
    t.ok(sheet)
    sheet.rows(function (err, rows) {
      t.notOk(err);
      t.ok(rows);
      t.equal(rows.length, 3)
      t.end()
    })
  })

})

test('update a sheet – sheet.addRows', function (t) {
  var data = {
    name: 'example',
    description: 'a really great sheet',
    project: 'health',
    categories: ['healthy', 'food'],
    websites: ['http://example.com'],
    owners: { nutrionist: true },
    editors: { eater: true },
    private: false,
    rows: [
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' }
    ]
  };

  sheets.create(data, function (err, sheet) {
    t.notOk(err)
    t.ok(sheet)
    var newData = [
      { ok: 'weeeee', cool: 'wooooo' },
      { ok: 'weeeee', cool: 'wooooo' },
      { ok: 'weeeee', cool: 'wooooo' }
    ];

    sheet.addRows(newData, function () {
      sheet.rows(function (err, rows) {
        t.notOk(err);
        t.ok(rows);
        t.equal(rows.length, 6)
        t.end()
      })
    })
  })
})

test('update a sheet – sheet.update', function (t) {
  var data = {
    name: 'example',
    description: 'a really great sheet',
    project: 'health',
    categories: ['healthy', 'food'],
    websites: ['http://example.com'],
    owners: { nutrionist: true },
    editors: { eater: true },
    private: false,
    rows: [
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' }
    ]
  };

  sheets.create(data, function (err, sheet) {
    t.notOk(err)
    t.ok(sheet)
    var newData = [
      { ok: 'weeeee', cool: 'wooooo' },
      { ok: 'weeeee', cool: 'wooooo' },
      { ok: 'weeeee', cool: 'wooooo' }
    ];

    sheet.update({ rows: newData }, function () {
      sheet.rows(function (err, rows) {
        t.notOk(err);
        t.ok(rows);
        t.equal(rows.length, 6)
        t.end()
      })
    })
  })
})

test('get a row – sheet.getRow', function (t) {
  var data = {
    name: 'example',
    description: 'a really great sheet',
    project: 'health',
    categories: ['healthy', 'food'],
    websites: ['http://example.com'],
    owners: { nutrionist: true },
    editors: { eater: true },
    private: false,
    rows: [
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' }
    ]
  };

  sheets.create(data, function (err, sheet) {
    t.notOk(err)
    t.ok(sheet)
    sheet.rows(function (err, rows) {
      t.notOk(err);
      t.ok(rows);
      
      sheet.getRow(rows[0].key, function (err, row) {
        t.notOk(err)
        t.ok(row)
        t.ok(row.properties)
        t.end()
      })
    })
  })
})

test('update a row', function (t) {
  var data = {
    name: 'update this',
    description: 'a really great sheet',
    project: 'health',
    categories: ['healthy', 'food'],
    websites: ['http://example.com'],
    owners: { nutrionist: true },
    editors: { eater: true },
    private: false,
    rows: [
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' }
    ]
  };

  sheets.create(data, function (err, sheet) {
    t.notOk(err)
    t.ok(sheet)
    sheet.rows(function (err, rows) {
      t.notOk(err);
      t.ok(rows);
      sheet.getRow(rows[0].key, function (err, row) {
        row.value.ok = 'cool'
        sheet.updateRow(row.key, row, function (err, updated) {
          t.notOk(err)
          t.ok(updated)
          t.equals(updated.value.ok, 'cool')
          t.end()
        })
      })
    })
  })
})

test('delete a row', function (t) {
  var data = {
    name: 'delete this',
    description: 'a really great sheet',
    project: 'health',
    categories: ['healthy', 'food'],
    websites: ['http://example.com'],
    owners: { nutrionist: true },
    editors: { eater: true },
    private: false,
    rows: [
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' },
      { example: 'weeeee', wat: 'wooooo' }
    ]
  };

  sheets.create(data, function (err, sheet) {
    t.notOk(err)
    t.ok(sheet)
    sheet.rows(function (err, rows) {
      t.notOk(err);
      t.ok(rows);
      sheet.deleteRow(rows[0].key, function (err) {
        t.notOk(err)
        sheet.getRow(rows[0].key, function (err, row) {
          t.ok(err)
          t.notOk(row)
          t.end()
        })
      })
    })
  })
})

test('teardown', function (t) {
  sheets.list(function (err, list) {
    t.notOk(err)
    t.ok(list)

    function iterator (item, i, next) {
      sheets.get(item.key, function (err, sheet) {
        sheet.destroy(function (err) {
          t.notOk(err)
          next()
        })
      })
    }

    function end () {
      t.end()
    }

    each(list, iterator, end)
  })
})