var Model = require('level-model')
var inherits = require('inherits')
var extend = require('extend')

module.exports = Organization
inherits(Organization, Model)

function Organization (db, options) {
  if (!(this instanceof Organization)) return new Organization(db, options)

  options = extend(options, {
    modelName: 'Organization',
    indexKeys: ['orgName'],
    properties: {
      orgName: { type: 'string' },
      website: { type: 'string' },
    },
    required: ['orgName']
  })

  Model.call(this, db, options)
}

