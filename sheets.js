var level = require('level');
var uuid = require('uuid').v1;
var extend = require('extend');

module.exports = Sheets;

function Sheets (db, opts) {
  if (!(this instanceof Sheets)) return new Sheets(db, opts);
  this.db = db || level('./data/sheets', {
    valueEncoding: 'json'
  });
}

Sheets.prototype.create = function (data, cb) {
  var self = this;
  var key = uuid();
  data.id = key;
  
  this.db.put(key, data, function (err) {
    self.db.get(key, function (err, sheet) {
      cb(err, sheet, key);
    });
  });
};

Sheets.prototype.put = Sheets.prototype.create;

Sheets.prototype.fetch = function (key, cb) {
  this.db.get(key, cb);
};

Sheets.prototype.get = Sheets.prototype.fetch;

Sheets.prototype.list = function (opts, cb) {
  var defaultOpts = { keys: false, values: true };

  if (typeof opts === 'function') {
    var cb = opts;
    var opts = defaultOpts;
  } else {
    var opts = extend(defaultOpts, opts);
  }
  
  if (!cb) return this.db.createReadStream(opts);

  var results = [];
  this.db.createReadStream(opts)
    .on('data', function (data) {
      results.push(data);
    })
    .on('error', function (err) {
      return cb(err);
    })
    .on('end', function () {
      return cb(null, results);
    });
};

Sheets.prototype.update = function (key, data, cb) {
  var self = this;
  this.db.put(key, data, function (err) {
    if (err) return cb(err);
    self.db.get(key, cb);
  });
};

Sheets.prototype.destroy = function (key, cb) {
  this.db.del(key, cb);
};
