var format = require('json-format-stream');
var collect = require('stream-collector');
var sublevel = require('subleveldown');
var deleteRange = require('level-delete-range');
var dat = require('dat-core');
var cuid = require('cuid');
var each = require('each-async');
var extend = require('extend');
var validator = require('is-my-json-valid')
var type = require('type-of')

var timestamp = require('../lib/timestamp');

module.exports = Sheet;

function Sheet (sheets, opts) {
  if (!(this instanceof Sheet)) return new Sheet(sheets, opts);

  this.key = opts.key
  this.sheets = sheets
  this.db = sublevel(sheets._db, 'sheet-' + opts.key)
  this.dat = dat(this.db, { valueEncoding: 'json' })

  this.metadata = {
    key: opts.key,
    name: opts.name,
    description: opts.description || null,
    schema: opts.schema || require('./schemas/row-schema.json'),
    project: opts.project || null,
    categories: opts.categories || [],
    websites: opts.websites || [],
    editors: opts.editors || {},
    owners: opts.owners || {},
    private: opts.private || false,
    created: opts.created || timestamp(),
    updated: opts.updated || null
  }

  this.validate = validator(this.metadata.schema)
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

  if (!row.value) var row = { key: key, value: row }
  var properties = extend((row.properties || {}), this.inferProperties(row.value))
  properties = extend(this.metadata.schema.properties, properties)
  var propertyKeys = Object.keys(properties)

  propertyKeys.forEach(function (propKey) {
    if (!(propKey in row.value)) {
      row.value[propKey] = properties[propKey].default || null
    }
  })
  
  this.sheets.db.put(self.key, self.metadata, function () {
    self.dat.put(key, row.value, function (err) {
      if (err) return cb(err)
      cb(null, row)
    })
  })
}

Sheet.prototype.addRows = function (rows, cb) {
  var self = this;
  each(rows, function (row, i, next) {
    self.addRow(row, next)
  }, cb)
}

Sheet.prototype.getRow = function (key, cb) {
  var self = this
  this.dat.get(key, function (err, row) {
    if (err) return cb(err)
    row.properties = self.metadata.schema.properties
    cb(null, row)
  })
}

Sheet.prototype.deleteRow = function (key, cb) {
  this.dat.del(key, cb);
}

Sheet.prototype.addColumn = function (property, cb) {
  // it would add the property to every row as null or with a default value
  // and add the property to the schema
}

Sheet.prototype.removeColumn = function (property, cb) {
  // it would remove the property from every row
  // and remove the property from the schema
}

Sheet.prototype.addProperty = function (property, cb) {
  this.metadata.schema.properties[property.key] = property
  this.update(this.metadata, cb)
}

Sheet.prototype.removeProperty = function (key, cb) {
  if (this.metadata.schema.properties[property.key]) {
    delete this.metadata.schema.properties[property.key]
    return this.update(this.metadata, cb)
  }
  cb(new Error('Property `' + key + '` not defined'))
}

Sheet.prototype.propertyKeys = function () {
  return Object.keys(this.metadata.schema.properties)
}

Sheet.prototype.inferProperties = function (row) {
  var keys = Object.keys(row)
  var properties = {}
  
  keys.forEach(function (key) {
    var datatype = type(row[key])
    properties[key] = {
      type: datatype
    }
  })
  
  return properties
}