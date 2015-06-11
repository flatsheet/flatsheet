var sublevel = require('subleveldown')

module.exports = function (db) {
  function accountdownBasic (db, prefix) {
    return require('accountdown-basic')(db, prefix, { key: 'key' })
  }

  var accountdown = require('accountdown')(sublevel(db, 'accounts'), {
    login: { basic: accountdownBasic }
  })

  var accounts = require('accountdown-model')(accountdown, { 
    db: db,
    properties: {
      username: { type: 'string' },
      email: { type: 'string' },
      profile: { type: 'string' }
    },
    required: ['username', 'email', 'profile'],
    indexKeys: ['username', 'email', 'profile']
  })

  return accounts
}

