var sublevel = require('subleveldown');
var indexer = require('level-indexer');
var each = require('each-async');

module.exports = AccountIndexes;

function AccountIndexes (db, accountdown) {
  if (!(this instanceof AccountIndexes)) {
    return new AccountIndexes(db, accountdown);
  }
  this.db = db;
  this.indexDB = sublevel(db, 'account-indexes');
  this.accountdown = accountdown;
  var self = this;
  var indexOpts = {
    keys: false,
    values: true,
    map: function (key, cb) {
      self.accountdown.get(key, function (err, val) {
        cb(err, val)
      })
    }
  }

  this.indexes = {
    username: indexer(this.indexDB, ['username'], indexOpts),
    email: indexer(this.indexDB, ['email'], indexOpts)
  };
}

// returns the email's associated account as cb(err, account)
AccountIndexes.prototype.getKeyFromEmail =function (email, cb) {
  var opts = [ email ];
  this.indexes.email.findOne(opts, cb);
}

AccountIndexes.prototype.addIndexes = function (account, cb) {
  this.modifyIndexes('add', account, cb)
}

AccountIndexes.prototype.removeIndexes = function (account, cb) {
  this.modifyIndexes('remove', account, cb)
}

AccountIndexes.prototype.updateIndexes = function (account, cb) {
  var self = this
  this.removeIndexes(account, function () {
    self.addIndexes(account, cb)
  })
}

AccountIndexes.prototype.modifyIndexes = function (type, account, cb) {
  var self = this
  var keys = Object.keys(this.indexes)
  each(keys, iterator, end)

  function iterator (key, i, next) {
    self.indexes[key][type](account);
    next();
  }

  function end () {
    if (cb) cb()
  }
}

