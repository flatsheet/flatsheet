var TableEditor = require('table-editor');
var prettify = require('jsonpretty');
var elClass = require('element-class');
var domready = require('domready');
var levelup = require('levelup');
var leveljs = require('level-js');

/* create the table editor */
window.editor = new TableEditor('main-content');

/* get the help message */
var hello = document.getElementById('hello-message');

/* created the db */
window.db = levelup('sheet', { db: leveljs, valueEncoding: 'json' });

/* check to see if the sheet has has been added to the db already */
db.get('sheet', function (err, value) {
  if (err) return console.error(err);
  if (value.headers.length > 0) {
    elClass(hello).add('hidden');
    editor.set(value);
  }
});

/* listen for changes to the data and save the object to the db */
editor.on('change', function (change, data) {
  db.put('sheet', data, function (error) {
    if (error) console.error(error);
  });
});

/* button element and listener for adding a row */
var addRow = document.getElementById('add-row');
addRow.addEventListener('click', function (e) {
  editor.addRow();
});

/* button element and listener for adding a column */
var addColumn = document.getElementById('add-column');
addColumn.addEventListener('click', function (e) {
  if (editor.data.headers.length < 1) elClass(hello).add('hidden');
  if (editor.data.rows < 1) editor.addRow();
  var name = window.prompt('New column name');
  editor.addColumn({ name: name, type: 'string' });
});

/* get elements for codebox and its textarea */
var codeBox = document.getElementById('code-box');
var textarea = codeBox.querySelector('textarea');

/* button element and listener for showing the data as json */
var showJSON = document.getElementById('show-json');
showJSON.addEventListener('click', function (e) {
  editor.getJSON(function (data) {
    textarea.value = prettify(data);
    elClass(codeBox).remove('hidden');
  });
});

/* button element and listener for showing the data as csv */
var showCSV = document.getElementById('show-csv');
showCSV.addEventListener('click', function (e) {
  editor.getCSV(function (data) {
    textarea.value = data;
    elClass(codeBox).remove('hidden');
  });
});

/* button element and listener for closing the codebox */
var close = document.getElementById('close');
close.addEventListener('click', function (e) {
  textarea.value = '';
  elClass(codeBox).add('hidden');
});

/* button element and listener for clearing the db */
var reset = document.getElementById('reset');
reset.addEventListener('click', function (e) {
  var msg = 'Are you sure you want to reset this project? You will start over with an empty workspace.';
  if (window.confirm(msg)) {
    editor.reset();
    elClass(hello).remove('hidden');   
  };
});