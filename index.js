var TableEditor = require('table-editor');
var prettify = require('jsonpretty');
var elClass = require('element-class');
var domready = require('domready');
var levelup = require('levelup');
var leveljs = require('level-js');

window.editor = new TableEditor('main-content');
var hello = document.getElementById('hello-message');
window.db = levelup('sheet', { db: leveljs, valueEncoding: 'json' });

db.get('sheet', function (err, value) {
  if (err) return console.error(err);
  if (value.headers.length > 0) {
    elClass(hello).add('hidden');
    editor.set(value);
  }
});

  editor.on('change', function (change, data) {
    db.put('sheet', data, function (error) {
      if (error) console.error(error);
    });
  });

var addRow = document.getElementById('add-row');
addRow.addEventListener('click', function (e) {
  editor.addRow();
});

var addColumn = document.getElementById('add-column');
addColumn.addEventListener('click', function (e) {
  if (editor.data.headers.length < 1) elClass(hello).add('hidden');
  if (editor.data.rows < 1) editor.addRow();
  var name = window.prompt('New column name');
  editor.addColumn({ name: name, type: 'string' });
});

var codeBox = document.getElementById('code-box');
var textarea = codeBox.querySelector('textarea');

var showJSON = document.getElementById('show-json');
showJSON.addEventListener('click', function (e) {
  editor.getJSON(function (data) {
    textarea.value = prettify(data);
    elClass(codeBox).remove('hidden');
  });
});

var showCSV = document.getElementById('show-csv');
showCSV.addEventListener('click', function (e) {
  editor.getCSV(function (data) {
    textarea.value = data;
    elClass(codeBox).remove('hidden');
  });
});

var close = document.getElementById('close');
close.addEventListener('click', function (e) {
  textarea.value = '';
  elClass(codeBox).add('hidden');
});

var reset = document.getElementById('reset');
reset.addEventListener('click', function (e) {
  var msg = 'Are you sure you want to reset this project? You will start over with an empty workspace.';
  if (window.confirm(msg)) {
    editor.reset();
    elClass(hello).remove('hidden');   
  };
});
