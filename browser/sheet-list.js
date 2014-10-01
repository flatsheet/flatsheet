var fs = require('fs');
var on = require('component-delegate').bind;
var domify = require('domify');
var dom = require('dom-tree');
var Handlebars = require('handlebars');

var templates = {
  modal: Handlebars.compile(
    fs.readFileSync(__dirname + '/views/modal.html', 'utf8')
  ),
  newSheet: Handlebars.compile(
    fs.readFileSync(__dirname + '/views/new-blank-sheet.html', 'utf8')
  )
};

on(document.body, '#new-blank-sheet', 'click', function (e) {
  var modal = templates.modal({
    content: templates.newSheet()
  });

  dom.add(document.body, domify(modal));
});

on(document.body, '#close-modal', 'click', function (e) {
  dom.remove('#modal');
});
