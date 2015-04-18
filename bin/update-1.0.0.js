var level = require('level')
var each = require('each-async')

var db = level(__dirname + '/../data/db', { valueEncoding: 'json' })
var sheets = require('../models/sheets')(db)

/*
* updates sheets to match expected data changes:
* accessible_by => editors
* id => key
*/

sheets.list(function (err, list) {
  list.forEach(function (sheet) {
    if (!sheet.key) {
      sheet.key = sheet.id
      delete sheet.id
    }

    if (!sheet.editors) {
      sheet.editors = sheet.accessible_by
      delete sheet.accessible_by
    }
    if (!sheet.websites) {
      sheet.websites = []
    }
    if (!sheet.editors) {
      sheet.editors = {};
    }
    if (!sheet.project) {
      sheet.project = null;
    }

    sheets.put(sheet, function (err, updated) {
      console.log(err, updated)
    })
  })
})