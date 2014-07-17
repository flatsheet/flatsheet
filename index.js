var fs = require('fs');
var TableEditor = require('table-editor');
var prettify = require('jsonpretty');
var elClass = require('element-class');
var domready = require('domready');
var levelup = require('levelup');
var leveljs = require('level-js');
var on = require('dom-event');
var remove = require('remove-element');
var closest = require('discore-closest');

var menuToggle = require('./lib/menu-toggle');

/* get the table template */
var tableTemplate = fs.readFileSync('./templates/table.html', 'utf8');

/* create the table editor */
window.editor = new TableEditor('main-content', { headers: [], rows: [] }, tableTemplate);

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

on(addRow, 'click', function (e) {
  editor.addRow();
});

/* button element and listener for adding a column */
var addColumn = document.getElementById('add-column');

on(addColumn, 'click', function (e) {
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

on(showJSON, 'click', function (e) {
  editor.getJSON(function (data) {
    textarea.value = prettify(data);
    elClass(codeBox).remove('hidden');
  });
});

/* button element and listener for showing the data as csv */
var showCSV = document.getElementById('show-csv');

on(showCSV, 'click', function (e) {
  editor.getCSV(function (data) {
    textarea.value = data;
    elClass(codeBox).remove('hidden');
  });
});

/* button element and listener for closing the codebox */
var close = document.getElementById('close');

on(close, 'click', function (e) {
  textarea.value = '';
  elClass(codeBox).add('hidden');
});

/* button element and listener for clearing the db */
var reset = document.getElementById('reset');

on(reset, 'click', function (e) {
  var msg = 'Are you sure you want to reset this project? You will start over with an empty workspace.';
  if (window.confirm(msg)) {
    editor.reset();
    elClass(hello).remove('hidden');   
  };
});

/* element and listener for the table header */
var tableHeader = document.getElementById('table-header');

on(tableHeader, 'click', function (e) {
  if (elClass(e.target).has('setting')) {
    var btn = e.target.id.split('-');

    if (btn[0] === 'delete') {
      if (window.confirm('Sure you want to delete this column and its contents?')) {
        editor.deleteColumn(btn[1]);
      }
    }

    if (btn[0] === 'rename') {
      var newName = window.prompt('Choose a new column name:')
      if (newName) editor.renameColumn(btn[1], newName);
    }
  }

  else menuToggle('header', e.target)
});

/* element and listener for the table body */
var tableBody = document.getElementById('table-body');

on(tableBody, 'click', function (e) {
  var btn;

  if (elClass(e.target).has('delete-row')) btn = e.target;
  else if (elClass(e.target).has('delete-btn-icon')) btn = closest(e.target, '.delete-row');
  else return;
  
  console.log(btn);

  if (window.confirm('Sure you want to delete this row and its contents?')) {
    var row = closest(btn, 'tr');
    console.log(row.className, row, btn)
    editor.deleteRow(row.className);
  }
});
