var level = require('level');
var uuid = require('uuid').v1;

module.exports = Sheets;

function Sheets (db, opts) {
  if (!(this instanceof Sheets)) return new Sheets(db, opts);
  this.db = db || level('./data/sheets', {
    valueEncoding: 'json'
  });
}

Sheets.prototype.create = function (data, cb) {
  var self = this;
  var token = uuid();

  this.db.put(token, data, function (err) {
    self.db.get(token, function (err, sheet) {
      cb(err, sheet);
    });
  });
}

Sheets.prototype.fetch = function (name, cb) {
  this.db.get(name, cb);
}

Sheets.prototype.list = function (fn, opts) {
  if (typeof fn === 'function') {
    var results = [];
    this.db.createReadStream()
      .on('data', function (data) {
        results.push(data);
      })
      .on('error', function (err) {
        return fn(err);
      })
      .on('end', function () {
        return fn(null, results);
      });

  }
  else {
    var opts = fn;
    return this.db.createReadStream(opts);
  }
}

Sheets.prototype.update = function () {
  this.db.put(name, data, cb);
}

Sheets.prototype.destroy = function (name, cb) {
  this.db.del(name, cb);
}
