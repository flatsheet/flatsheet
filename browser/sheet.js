var fs = require('fs')
var url = require('url')
var through = require('through2')
var debounce = require('lodash.debounce')
var on = require('dom-event')

var grid = require('data-grid')({
  appendTo: document.getElementById('main-content'),
  height: window.innerHeight - 100
})

var flatsheet = require('flatsheet-api-client')({ 
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
  var rows = sheet.rows
  var length = rows.length
  var i = 0

  for (i; i<=length; i++) {
    model.write(rows[i])
  }

  createEventListeners(sheet.schema.properties.rows.items.properties)
}

grid.on('input', function (e, property, row) {
  flatsheet.sheets.updateRow(key, row, function (err, res) {
    console.log(err, res)
  })
})


function createEventListeners (properties) {
  on(document.getElementById('add-row'), 'click', function (e) {
    var row = {}
    
    for (var prop in properties) {
      row[prop] = properties[prop]
    }
    console.log(row, properties)

    flatsheet.sheets.addRow(row, function (err, res) {
      console.log(err, res)
      model.write(res)
    })
  })
}
