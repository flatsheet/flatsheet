var fs = require('fs')
var url = require('url')
var through = require('through2')
var debounce = require('lodash.debounce')
var extend = require('extend')
var on = require('dom-event')
var dataSchema = require('data-schema')

var grid = require('data-grid')({
  appendTo: document.getElementById('main-content'),
  height: window.innerHeight - 100
})

window.flatsheet = require('flatsheet-api-client')({ 
  host: window.location.origin
})

var model = through.obj(function (chunk, enc, cb) {
  this.push(chunk)
  cb()
})

var all = []
model.on('data', function (data) {
  all.push(data)
  render(all)
})

var key = window.location.pathname.split('/')[3]
var render = debounce(grid.render.bind(grid), 100)
flatsheet.sheets.get(key, getSheet)

function getSheet (err, sheet) {
  var schema = dataSchema(sheet.schema)
  var rows = sheet.rows
  var length = rows.length
  var i = 0
  console.log('schema', schema.schema)
  for (i; i<length; i++) {
    model.write(rows[i])
  }

  createEventListeners(sheet, schema)
}

grid.on('input', function (e, property, row) {
  flatsheet.sheets.updateRow(key, row.value, function (err, res) {
    console.log(err, res)
  })
})

function createEventListeners (sheet, schema) {
  on(document.getElementById('add-row'), 'click', function (e) {
    addRow(sheet, schema)
  })

  on(document.getElementById('add-column'), 'click', function (e) {
    var name = prompt('new column name')
    var property = schema.create({ name: name })
    addColumn(property, sheet, schema)
  })
}

function addRow (sheet, schema) {
  var row = schema.row()

  flatsheet.sheets.addRow(sheet.key, row, function (err, res) {
    model.write(res)
  })
}

function addColumn (property, sheet, schema) {
  var length = all.length
  var i = 0
  if (length > 0) {
    for (i; i<length; i++) {
      all[i].value = extend(all[i].value, schema.row())
    }
  }

  else {
    addRow(sheet, schema)
  }
  
  render(all)
  sheet.schema = schema.schema
  console.log('schema', sheet.schema)
  flatsheet.sheets.update(sheet, function (err, res) {
    console.log('this is after updating with a new column', res)
  })
}
