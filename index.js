var TableEditor = require('table-editor');
var prettify = require('jsonpretty');
var elClass = require('element-class');
var remove = require('remove-element');

var data = {
  headers: [],
  rows: []
};

var editor = new TableEditor('main-content', data);

var addRow = document.getElementById('add-row');
addRow.addEventListener('click', function (e) {
  editor.addRow();
});

var addColumn = document.getElementById('add-column');
addColumn.addEventListener('click', function (e) {
  if (editor.data.headers.length < 1) remove(document.getElementById('hello-message'));
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
