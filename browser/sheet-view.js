var sticky = require('sticky-header')
var on = require('component-delegate').bind

var header = document.getElementById('table-header')
sticky(header)

if (window.location.hash.length > 1) {
  var row = document.getElementById(window.location.hash.replace('#', ''))
  row.style.backgroundColor = '#FFFFCC'
  setTimeout(function () {
    window.scrollBy(0, -header.scrollHeight)
  }, 300)
}

on(document.body, '.row', 'click', function (e) {
  var row = e.target.parentNode
  
  var rows = Array.prototype.slice.call(document.querySelectorAll('.row'))

  rows.forEach(function (item) {
    if (item.id === row.id) row.style.backgroundColor = '#FFFFCC'
    else item.style.backgroundColor = '#fff'
  })
  
  var rect = row.getBoundingClientRect();
  window.location.hash = row.id
  window.scrollBy(0, -header.scrollHeight)
})
