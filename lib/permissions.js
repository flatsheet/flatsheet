var redirect = require('./redirect');

module.exports = Permissions;

function Permissions (server) {

  if (!(this instanceof Permissions)) return new Permissions(server);

  this.server = server;
  //res.writeHead((status || 302), { 'Location': location });
  //return res.end();
}

Permissions.prototype.authorizeSession = function (req, res, cb) {
  this.server.getUserBySession(req, function (err, user, session) {
    if (err) return redirect(res, '/', 302);
    else cb(null, user, session);
  });
};

Permissions.prototype.authorizeAPI = function (req, res, cb) {
  var self = this;
  if (!req.headers.authorization) return cb('Unauthorized');

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
  if (req.headers.authorization !== ':') return this.authorizeAPI(req, res, cb);
  return this.authorizeSession(req, res, cb)
};
