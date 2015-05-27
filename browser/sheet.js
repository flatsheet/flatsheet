var fs = require('fs')
var url = require('url')
var through = require('through2')
var debounce = require('lodash.debounce')

var grid = require('data-grid')({
  appendTo: document.getElementById('grid'),
  height: window.innerHeight - 100
})

var flatsheet = require('flatsheet-api-client')({ 
  host: window.location.origin
})

var render = debounce(grid.render.bind(grid), 100)

grid.on('input', function (e, property, row) {
  flatsheet.sheets.put(row.key, row, function (err, res) {
    console.log(err, res)
  })
})