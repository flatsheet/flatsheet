var Emitter = require('events').EventEmitter
var inherits = require('util').inherits
var validator = require('is-my-json-valid')
var indexer = require('level-simple-indexes')
var filterObject = require('filter-object')
var sublevel = require('subleveldown')
var isEmail = require('is-email')
var extend = require('extend')
var cuid = require('cuid')

module.exports = AccountdownModel
inherits(AccountdownModel, Emitter)

/*
* a wrapper around accountdown that provides a few additional features
* it assumes that you are using accountdown-basic as one of the login plugins
*
* data model is expected to be:

{
  login: { 
    basic: { key: 'string', password: 'string' } // ...(other login types)
  },
  value: {
    username: 'string',
    key: 'string',
    // additional properties, like the key of a profile model, for example
  }
}

*/

function AccountdownModel (accountdown, options) {
  if (!(this instanceof AccountdownModel)) return new AccountdownModel(accountdown, options)
  Emitter.call(this)
  options = options || {}
  var self = this

  this.db = options.db
  this.accountdown = accountdown

  var schema = options.schema || filterObject(options, [
    '*', '!modelName', '!timestamp', '!indexKeys', '!validateOptions', '!db'
  ])

  this.modelName = options.modelName || 'accounts'
  this.timestamps = options.timestamps || true
  this.timestamp = options.timestamp || function () { return new Date(Date.now()).toISOString() }
  this.indexKeys = options.indexKeys || []
  this.indexKeys = this.indexKeys.concat(['username', 'email'])

  schema.properties = extend({
    key: { type: 'string' },
    username: { type: 'string' },
    email: { type: 'string' }
  }, schema.properties)

  options.schema = extend({
    title: self.modelName,
    type: 'object'
  }, schema)

  options.schema.required = options.schema.required || []
  options.schema.required = options.schema.required.concat(['key', 'username', 'email'])

  this.validateOptions = options.validateOptions
  this.schema = options.schema
  this.validateValue = validator(options.schema, options.validateOptions)

  this.validateLogin = validator({
    properties: {
      login: { 
        type: 'object',
        properties: {
          basic: {
            type: 'object',
            properties: { key: { type: 'string' }, password: { type: 'string' } }
          }
        }
      },
      value: { type: 'object' }
    }
  })

  function map (key, callback) {
    self.get(key, function (err, val) {
      callback(err, val)
    })
  }

  var indexOptions = extend(options.indexOptions, {
    properties: this.indexKeys,
    keys: true,
    values: true,
    map: map
  })
  
  this.indexDB = sublevel(options.db, this.modelName + '-index')
  this.indexer = indexer(this.indexDB, indexOptions)
  console.log(this.indexer)
}

AccountdownModel.prototype.verify = function (type, creds, callback) {
  this.accountdown.verify(type, creds, callback)
}

AccountdownModel.prototype.register = function (type, plugin) {
  this.accountdown.verify(type, plugin)
}

AccountdownModel.prototype.addLogin = function (key, type, creds, callback) {
  this.accountdown.addLogin(key, type, creds, callback)
}

AccountdownModel.prototype.listLogin = function (key) {
  return this.accountdown.listLogin(key)
}

AccountdownModel.prototype.removeLogin = function (key, type, callback) {
  return this.accountdown.removeLogin(key, type, callback)
}

AccountdownModel.prototype.put =
AccountdownModel.prototype.save = function (key, options, callback) {
  if (typeof key === 'object') {
    callback = data
    data = key
    key = data.key
  }

  if (!options.value.key) return this.create(data, callback)
  return this.update(key, data, callback)
}

AccountdownModel.prototype.create = function (key, data, callback) {
  var self = this

  if (typeof key === 'object') {
    callback = data
    data = key
    key = data.value.key = data.login.basic.key
  }

  if (!key) var key = data.value.key = data.login.basic.key = cuid()
  var validatedLogin = this.validateLogin(data)

  if (!validatedLogin) {
    // TODO: more useful error message
    return callback(new Error(this.modelName + ' login object requires key and accountdown-basic'))
  }

  var validatedValue = this.validateValue(data.value)

  if (!validatedValue) {
    // TODO: more useful error message
    return callback(new Error(this.modelName + ' object does not match schema'))
  }

  if (this.timestamps) {
    data.value.created = this.timestamp()
    data.value.updated = null
  }

  this.accountdown.create(key, data, function (err) {
    if (err) return callback(err)
    delete data.login.basic.password

    self.indexer.addIndexes(data.value, function () {
      self.emit('create', data)
      callback(null, data)
    })
  })
}

AccountdownModel.prototype.get = function (id, callback) {
  this.accountdown.get(id, callback)
}

AccountdownModel.prototype.update = function (key, data, callback) {
  var self = this

 if (typeof key === 'object') {
   callback = data
   data = key
   key = data.value.key
 }

 this.get(key, function (err, model) {
   if (err || !model) return callback(new Error(self.modelName + ' not found with key ' + key))
   model = extend(model, data)
   if (self.timestamps) model.updated = self.timestamp()
   self.indexer.updateIndexes(model, function () {
     self.accountdown.put(key, model, function (err) {
       self.emit('update', model)
       callback(err, model)
     })
   })
 })
}

AccountdownModel.prototype.del =
AccountdownModel.prototype.delete =
AccountdownModel.prototype.remove = function (key, callback) {
  var self = this
  this.get(key, function (err, data) {
    if (err || !data) return callback(err)
    self.indexer.removeIndexes(data, function () {
      self.emit('delete', data)
      self.accountdown.remove(key, callback)
    })
  })
}

AccountdownModel.prototype.resetPassword = function (key, data, callback) {
  this.get(key, function (err, account) {
    if (err) return callback(err)
    
    // TODO
    
    callback(account)
  })
}

AccountdownModel.prototype.changeUsername = function (key, username, callback) {
  // TODO
}

AccountdownModel.prototype.list =
AccountdownModel.prototype.createReadStream = function (options) {
  return this.accountdown.list(options)
}

AccountdownModel.prototype.findOne =function (identifier, callback) {
  if (isEmail(identifier)) return this.getKeyFromEmail(identifier, callback)
  return this.getKeyFromUsername(identifier, callback)
}

AccountdownModel.prototype.getKeyFromEmail =function (email, callback) {
  var options = [email]
  this.indexer.indexes.email.findOne(email, callback)
}

AccountdownModel.prototype.getKeyFromUsername =function (username, callback) {
  var options = [username]
  this.indexer.indexes.username.findOne(username, callback)
}