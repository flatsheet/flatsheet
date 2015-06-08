var cuid = require('cuid')

module.exports = [
  {
    login: { basic: { key: cuid(), password: 'test' } },
    value: { username: 'test', email: 'test@example.com' }
  },
  {
    login: { basic: { key: cuid(), password: 'example' } },
    value: { username: 'example', email: 'example@example.com' }
  },
  {
    login: { basic: { key: cuid(), password: 'pizza' } },
    value: { username: 'pizza', email: 'pizza@example.com' }
  },
  {
    login: { basic: { key: cuid(), password: 'poop' } },
    value: { username: 'poop', email: 'poop@example.com' }
  }
]