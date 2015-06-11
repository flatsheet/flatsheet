var Model = require('level-model')
var inherits = require('inherits')
var extend = require('extend')

module.exports = Profile
inherits(Profile, Model)

function Profile (db, options) {
  if (!(this instanceof Profile)) return new Profile(db, options)

  options = extend(options, {
    modelName: 'Profile',
    indexKeys: ['account', 'organizations', 'username', 'email'],
    properties: {
      account: { type: 'string' },
      username: { type: 'string' },
      email: { type: 'string' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      website: { type: 'string' },
      organizations: { type: 'array' }
    },
    required: ['account', 'firstName', 'lastName', 'username', 'email']
  })

  Model.call(this, db, options)
}