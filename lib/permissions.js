var redirect = require('./redirect');

module.exports = Permissions;

function Permissions (server) {
  if (!(this instanceof Permissions)) return new Permissions(server);
  this.server = server;
}

Permissions.prototype.authorizeSession = function (req, res, cb) {
  this.server.getAccountBySession(req, function (err, user, session) {
    if (err) return cb('Unauthorized');
    else cb(null, user, session);
  });
};

Permissions.prototype.authorizeAPI = function (req, cb) {
  if (!req.headers.authorization) return cb('Unauthorized');
  var self = this;
  var cred = req.headers.authorization.split(':');
  var account = { username: cred[0], password: cred[1] };

  this.server.accountdown.verify('basic', account, function (err, ok, id) {
    if (err) return cb(err);
    if (!ok) return cb(new Error('incorrect password or username'));

    self.server.accountdown.get(id, function (userError, value) {
      if (userError) return cb(userError);
      cb(null, value);
    });
  });
};

Permissions.prototype.authorize = function (req, res, cb) {
  if (req.headers.authorization) return this.authorizeAPI(req, cb);
  return this.authorizeSession(req, res, cb)
};

Permissions.prototype.sheetAccessible = function (sheet, account) {
  if (!sheet) return false;
  if (!account && sheet.private) return false;
  if (sheet.isPrivate() === false) return true;
  var editor = Object.keys(sheet.metadata.editors).indexOf(account.username) >= 0;
  var owner = Object.keys(sheet.metadata.owners).indexOf(account.username) >= 0;
  if (editor || owner || (account && account.admin)) return true;
  return false;
}

Permissions.prototype.sheetEditable = function (sheet, account) {
  if (!sheet || !account) return false;
  var editor = Object.keys(sheet.metadata.editors).indexOf(account.username) >= 0;
  var owner = Object.keys(sheet.metadata.owners).indexOf(account.username) >= 0;
  if (editor || owner || (account && account.admin)) return true
  return false;
}

Permissions.prototype.sheetDestroyable = function (sheet, account) {
  if (!sheet || !account) return false;
  var owner = Object.keys(sheet.metadata.owners).indexOf(account.username) >= 0;
  if (owner || (account && account.admin)) return true;
  return false;
}