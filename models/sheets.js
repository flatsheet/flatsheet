var level = require('level');
var uuid = require('uuid').v1;
var extend = require('extend');

var Sheets = (function() {

  function Sheets (db, opts) {
    if (!(this instanceof Sheets)) {
      return new Sheets(db, opts);
    }
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

  var list = function (opts, cb) {
    var defaultOpts = {keys: false, values: true};

    if (typeof opts === 'function') {
      var cb = opts;
      var opts = defaultOpts;
    } else {
      var opts = extend(defaultOpts, opts);
    }

    if (!cb) {
      return this.db.createReadStream(opts);
    }

    var results = [];
    console.log("opts:");
    console.log(opts);
    console.log("filter:");
    console.log(opts.filter);
    this.db.createReadStream(opts)
      .on('data', function (data) {
        if (opts.filter) {
          if (opts.username in data.accessible_by) {
            console.log("pushing data to results:");
            console.log(data);
            results.push(data);
          }
        } else {
          results.push(data);
        }
      })
      .on('error', function (err) {
        return cb(err);
      })
      .on('end', function () {
        return cb(null, results);
      });
  };

  Sheets.prototype.list = function (opts, cb) {
    return list.apply(this, [opts, cb]);
  };

  Sheets.prototype.listAccessible = function (username, cb) {
    return list.apply(this, [{filter: true, username: username}, cb]);
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

  return Sheets;
})();

module.exports = Sheets;
