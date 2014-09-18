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
      cb(err, sheet, token);
    });
  });
}

Sheets.prototype.put = Sheets.prototype.create;

Sheets.prototype.fetch = function (name, cb) {
  this.db.get(name, cb);
}

Sheets.prototype.get = Sheets.prototype.fetch;

Sheets.prototype.list = function (cb, opts) {
  if (typeof cb === 'function') {
    var results = [];
    this.db.createReadStream()
      .on('data', function (data) {
        results.push(data);
      })
      .on('error', function (err) {
        return cb(err);
      })
      .on('end', function () {
        return cb(null, results);
      });
  }
  else {
    var opts = cb;
    return this.db.createReadStream(opts);
  }
}

Sheets.prototype.update = function (name, data, cb) {
  this.db.put(name, data, cb);
}

Sheets.prototype.destroy = function (name, cb) {
  this.db.del(name, cb);
}
