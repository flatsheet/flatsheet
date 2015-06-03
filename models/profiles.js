var Model = require('level-model')
var inherits = require('inherits')
var extend = require('extend')

module.exports = Profile

function Profile (db, options) {
  if (!(this instanceof Profile)) return new Profile(db, options)

  options = extend(options, {
    modelName: 'Profile',
    indexKeys: ['account', 'organizations'],
    properties: {
      account: { type: 'string' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      website: { type: 'string' },
      organizations: {
        type: 'object'
        properties: {}
      }
    },
    required: ['account', 'firstName', 'lastName']
  })

  Model.call(this, db, options)
}

inherits(Profile, Model)