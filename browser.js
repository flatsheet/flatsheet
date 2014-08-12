var fs = require('fs');
var TableEditor = require('table-editor');
var prettify = require('jsonpretty');
var elClass = require('element-class');
var domready = require('domready');
var levelup = require('levelup');
var leveljs = require('level-js');
var on = require('component-delegate').bind;
var remove = require('remove-element');
var closest = require('component-closest');
var menuToggle = require('./lib/menu-toggle');
var randomColor = require('random-color');
var unflatten = require('flat').unflatten;
var deepEqual = require('deep-equal');
var extend = require('extend');

var server;
if (process.env.NODE_ENV === 'production') server = 'http://flatsheet-realtime.herokuapp.com'
else server = 'http://localhost:3000';

var io = require('socket.io-client')(server);
var user = {};

io.on('connect', function(s){
  user.id = this.io.engine.id;
  console.log('connection:', this.io.engine.id);
});

io.on('change', function (change, id) {
  editor.set(change);
});

io.on('cell-focus', function (id, color) {
  document.querySelector(id + ' textarea').style.borderColor = color;
});

io.on('cell-blur', function (id) {
  document.querySelector(id + ' textarea').style.borderColor = '#ccc';
});

io.on('disconnect', function(){
  console.log('disconnection.');
});

/* get the table template */
var template = fs.readFileSync('./templates/table.html', 'utf8');

/* create the table editor */
window.editor = new TableEditor({
  el: 'main-content',
  template: template
});

/* get the help message */
var hello = document.getElementById('hello-message');

/* created the db */
window.db = levelup('sheet', { db: leveljs, valueEncoding: 'json' });

/* check to see if the sheet has has been added to the db already */
db.get('sheet', function (err, value) {
  console.log(value)
  if (err && err.type === "NotFoundError") editor.clear();
  else if (value.columns && value.columns.length > 0) {
    elClass(hello).add('hidden');
    editor.set(value);
  }
  else editor.clear();
});

/* listen for changes to the data and save the object to the db */
editor.on('change:rows', function (change) {
  db.put('sheet', editor.data, function (error) {
    if (error) console.error(error);
    console.log('in editor.on change', change)
    clearTimeout(timer);
    var timer = setTimeout(function() {
      //io.emit('change', 'rows', change);
    }, 1000);
  });
});

editor.on('change:columns', function (change) {
  db.put('sheet', editor.data, function (error) {
    if (error) console.error(error);
    console.log('in editor.on change', change)
    clearTimeout(timer);
    var timer = setTimeout(function() {
      //io.emit('change', 'columns', change);
    }, 1000);
  });
});


/* listener for adding a row */
on(document.body, '#add-row', 'click', function (e) {
  editor.addRow();
});

/* listener for adding a column */
on(document.body, '#add-column', 'click', function (e) {
  if (editor.get('columns')) elClass(hello).add('hidden');
  var name = window.prompt('New column name');
  if (name) editor.addColumn({ name: name, type: 'string' });
});

/* get elements for codebox and its textarea */
var codeBox = document.getElementById('code-box');
var textarea = codeBox.querySelector('textarea');

/* listener for showing the data as json */
on(document.body, 'show-json', 'click', function (e) {
  editor.getJSON(function (data) {
    textarea.value = prettify(data);
    elClass(codeBox).remove('hidden');
  });
});

/* listener for showing the data as csv */
on(document.body, 'show-csv', 'click', function (e) {
  editor.getCSV(function (data) {
    textarea.value = data;
    elClass(codeBox).remove('hidden');
  });
});

/* listener for closing the codebox */
on(document.body, '#close', 'click', function (e) {
  textarea.value = '';
  elClass(codeBox).add('hidden');
});

/* listener for clearing the db */
on(document.body, '#reset', 'click', function (e) {
  var msg = 'Are you sure you want to reset this project? You will start over with an empty workspace.';
  if (window.confirm(msg)) {
    editor.clear();
    elClass(hello).remove('hidden');
  };
});

/* listener for the table header settings button */
on(document.body, '.header-settings-toggle', 'click', function (e) {
  if (elClass(e.target).has('setting')) {
    var btn = e.target.id.split('-');

    if (btn[0] === 'delete') {
      if (window.confirm('Sure you want to delete this column and its contents?')) {
        editor.destroyColumn(btn[1]);
      }
    }

    if (btn[0] === 'rename') {
      var newName = window.prompt('Choose a new column name:')
      if (newName) editor.renameColumn(btn[1], newName);
    }
  }

  else menuToggle('header', e.target);
});

/* listener for the table body */
on(document.body, '#table-body', 'click', function (e) {
  var btn;

  if (e.target.tagName === 'TEXTAREA') {
    var cellEl = document.getElementById(closest(e.target, 'td').id);

    var id = closest(e.target, 'td').id;
    io.emit('cell-focus', '#' + id);

    e.target.onblur = function (e) {
      io.emit('cell-blur', '#' + id);
    }

    return;
  }

  else if (elClass(e.target).has('delete-row')) btn = e.target;
  else if (elClass(e.target).has('delete-btn-icon')) btn = closest(e.target, '.delete-row');
  else return;

  if (window.confirm('Sure you want to delete this row and its contents?')) {
    var row = closest(btn, 'tr');
    console.log('happenenenenen', row.className.split('-')[1])
    editor.destroyRow(row.className.split('-')[1]);
    editor.update();
  }
});
