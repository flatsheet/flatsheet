var format = require('json-format-stream');
var collect = require('stream-collector');
var sublevel = require('subleveldown');
var deleteRange = require('level-delete-range');
var dat = require('dat-core');
var cuid = require('cuid');
var each = require('each-async');
var extend = require('extend');

var timestamp = require('../lib/timestamp');

module.exports = Sheet;

function Sheet (sheets, opts) {
  if (!(this instanceof Sheet)) return new Sheet(sheets, opts);
  var self = this;

  this.key = opts.key
  this.sheets = sheets
  this.db = sublevel(sheets._db, 'sheet-' + opts.key)
  this.dat = dat(this.db, { valueEncoding: 'json' })
  this.metadata = {
    key: opts.key,
    name: opts.name,
    description: opts.description || null,
    columns: opts.columns || [],
    project: opts.project || null,
    categories: opts.categories || [],
    websites: opts.websites || [],
    editors: opts.editors || {},
    owners: opts.owners || {},
    private: opts.private || false,
    created: opts.created || timestamp(),
    updated: opts.updated || null
  }
}

Sheet.prototype.createReadStream = function (opts) {
  var defaultOpts = { keys: true, values: true };

  if (typeof opts === 'function') {
    cb = opts;
    opts = defaultOpts;
  } else {
    opts = extend(defaultOpts, opts);
  }
  
  var stream = format(this.metadata, { outputKey: 'rows' })
  return this.dat.createReadStream(opts).pipe(stream)
}

Sheet.prototype.rows = function (opts, cb) {
  var defaultOpts = { keys: true, values: true };

  if (typeof opts === 'function') {
    cb = opts;
    opts = defaultOpts;
  } else {
    opts = extend(defaultOpts, opts);
  }
  
  return collect(this.dat.createReadStream(opts), cb)
}

Sheet.prototype.isPrivate = function () {
  return !!this.metadata.private;
}

Sheet.prototype.update = function (data, cb) {
  var self = this;

  if (data.rows) {
    var rows = data.rows;
    delete data.rows;
  }
  
  data.updated = timestamp();
  this.metadata = extend(this.metadata, data);

  this.sheets.updateIndexes(this.metadata, function () {
    self.sheets.db.put(self.key, self.metadata, function () {
      if (!rows) return self.sheets.get(self.key, cb);
      self.addRows(rows, function () {
        return cb(null, self)
      });
    });
  });
}

Sheet.prototype.destroy = function (cb) {
  var self = this;
  this.sheets.removeIndexes(this.metadata, function () {
    self.sheets.db.del(self.key, function () {
      self.dat.createKeyStream()
        .on('data', function (data) {
          self.deleteRow(data, function () {})
        })
        .on('end', cb)
    });
  });
}

Sheet.prototype.addRow = function (row, cb) {
  var self = this
  var key = row.key || cuid();

  this.dat.put(key, row, function (err) {
    if (err) return cb(err)
    self.dat.get(key, function (err, val) {
      cb(null, val)
    })
  });
}

Sheet.prototype.addRows = function (rows, cb) {
  var self = this;
  each(rows, function (row, i, next) {
    self.addRow(row, next)
  }, cb);
}

Sheet.prototype.getRow = function (key, cb) {
  this.dat.get(key, cb);
}

Sheet.prototype.deleteRow = function (key, cb) {
  this.dat.del(key, cb);
}

Sheet.prototype.addColumn = function (opts, cb) {
  
}

Sheet.prototype.removeColumn = function (id) {
  
}
