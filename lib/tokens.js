var jwt = require('jsonwebtoken')

module.exports = Tokens

function Tokens (opts) {
  if (!(this instanceof Tokens)) return new Tokens(opts)

  this.secret = opts.secret
}

Tokens.prototype.sign = function (req, res, payload, opts) {
  // payload = claims
  var token = jwt.sign(payload, this.secret, opts)
  req.headers['Authorization'] = "Bearer " + token
  return token
}

Tokens.prototype.verify = function (req, cb) {
  // req.headers.Authorization = 'Bearer <token>'
  var token = req.headers.Authorization.split(",")[0].split(" ")[1]
  if (!token) return cb("Failed to retrieve token from Authorization header")
  jwt.verify(token, this.secret, function (err, decoded) {
    return cb(err, decoded)
  })
}
