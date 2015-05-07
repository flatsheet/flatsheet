var level = require('level');
var uuid = require('uuid').v1;
var extend = require('extend');
var indexer = require('level-indexer');
var sublevel = require('subleveldown');
var collect = require('stream-collector');
var each = require('each-async');
var isArray = require('isarray');
var merge = require('merge2');
var clone = require('clone');

var timestamp = require('../lib/timestamp');
var Sheet = require('./sheet');

module.exports = Sheets;

function Sheets (db, opts) {
  if (!(this instanceof Sheets)) return new Sheets(db, opts);
  
  var self = this
  this._db = db;
  this.db = sublevel(db, 'sheets', { valueEncoding: 'json' });
  this.indexDB = sublevel(db, 'sheet-indexes');

  var indexOpts = {
    keys: false, 
    values: true,
    map: function (key, cb) {
      self.get(key, function (err, val) {
        cb(err, val)
      })
    }
  }

  this.indexes = {
    categories: indexer(this.indexDB, ['categories'], indexOpts),
    project: indexer(this.indexDB, ['project'], indexOpts),
    private: indexer(this.indexDB, ['private'], indexOpts),
    editors: indexer(this.indexDB, ['editors'], indexOpts),
    owners: indexer(this.indexDB, ['owners'], indexOpts)
  };
}

Sheets.prototype.create = function (data, cb) {
  var self = this
  data.key = uuid();
  
  if (data.rows) {
    var rows = data.rows;
    delete data.rows;
  }
  
  this.db.put(data.key, data, function (err) {
    if (err) return cb(err);
    self.addIndexes(data, function () {
      var sheet = Sheet(self, data)
      if (!rows) return cb(null, sheet)
      sheet.addRows(rows, function () {
        cb(null, sheet)
      });
    });
  });
};

Sheets.prototype.get = function (key, cb) {
  var self = this
  this.db.get(key, function (err, data) {
    if (err) return cb(err);
    return cb(null, Sheet(self, data));
  })
};

Sheets.prototype.list = function (opts, cb) {
  var defaultOpts = { keys: false, values: true };

  if (typeof opts === 'function') {
    cb = opts;
    opts = defaultOpts;
  } else {
    opts = extend(defaultOpts, opts);
  }

  if (opts.filter) {
    var index = Object.keys(opts.filter)[0]
    var value = opts.filter[index]

    if (index === 'accessible') {
      var editorstream = this.find('editors', value)
      var ownerstream = this.find('owners', value)
      var mergeStream = merge(editorstream, ownerstream)
      return collect(mergeStream, cb)
    } else {
      var findStream = this.find(index, value)
      return collect(findStream, cb)
    }
  } else {
    var stream = this.createReadStream(opts)
    return collect(stream, cb)
  }
};

Sheets.prototype.createReadStream = function (opts) {
  return this.db.createReadStream(opts)
}

Sheets.prototype.find = 
Sheets.prototype.createFindStream = function (index, opts) {
  if (typeof opts !== 'object') opts = { gte: opts, lte: opts }
  return this.indexes[index].find(opts)
}

Sheets.prototype.addIndexes = function (sheet, cb) {
  this.modifyIndexes('add', sheet, cb)
}

Sheets.prototype.removeIndexes = function (sheet, cb) {
  this.modifyIndexes('remove', sheet, cb)
}

Sheets.prototype.updateIndexes = function (sheet, cb) {
  var self = this
  this.removeIndexes(sheet, function () {
    self.addIndexes(sheet, cb)
  })
}

Sheets.prototype.modifyIndexes = function (type, sheet, cb) {
  var self = this
  var keys = Object.keys(this.indexes)
  each(keys, iterator, end)

  function iterator (key, i, next) {
    if (typeof sheet[key] === 'string' 
      || typeof sheet[key] === 'boolean'
      || key === 'accessible') {
      self.indexes[key][type](sheet)
      next()
    }
    
    else if (isArray(sheet[key])) {
      each(sheet[key], function (item, i, done) {
        var data = clone(sheet)
        data[key] = item
        self.indexes[key][type](data)
        done()
      }, function () {
        next()
      })
    }

    else if (sheet[key] && typeof(sheet[key]) === 'object') {
      var properties = Object.keys(sheet[key])
      if (!properties.length) return next()

      each(properties, function (item, i, done) {
        var data = clone(sheet)
        data[key] = item
        self.indexes[key][type](data)
        done()
      }, function () {
        next()
      })
    }
    
    else next()
  }

  function end () {
    if (cb) cb()
  }
}