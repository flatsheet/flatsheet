var cuid = require('cuid')

module.exports = [
  {
    login: { basic: { key: cuid(), password: 'test' } },
    value: { username: 'test', email: 'test@example.com', profile: '1' }
  },
  {
    login: { basic: { key: cuid(), password: 'example' } },
    value: { username: 'example', email: 'example@example.com', profile: '2' }
  },
  {
    login: { basic: { key: cuid(), password: 'pizza' } },
    value: { username: 'pizza', email: 'pizza@example.com', profile: '3' }
  },
  {
    login: { basic: { key: cuid(), password: 'poop' } },
    value: { username: 'poop', email: 'poop@example.com', profile: '4' }
  }
]