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

  // require the accountdown-basic plugin
  if (!(this.isRegistered('basic'))) throw new Error('Must use the accountdown-basic plugin')
  this._key = this.accountdown._logins['basic']._key
  if (this._key !== 'key') throw new Error('Must use `key` as accountdown-basic property key instead of username')

  var schema = options.schema || filterObject(options, [
    '*', '!modelName', '!timestamp', '!indexKeys', '!validateOptions', '!db'
  ])

  this.modelName = options.modelName || 'accounts'
  this.timestamps = options.timestamps || true
  this.timestamp = options.timestamp || function () { return new Date(Date.now()).toISOString() }
  this.indexKeys = options.indexKeys || []
  this.indexKeys = this.indexKeys.concat(['username', 'email'])

  schema.properties = extend({}, schema.properties)
  schema.properties[this._key] = { type: 'string' }

  options.schema = extend({
    title: self.modelName,
    type: 'object'
  }, schema)

  options.schema.required = options.schema.required || []
  options.schema.required.concat(this._key)

  this.validateOptions = options.validateOptions
  this.schema = options.schema
  this.validateValue = validator(options.schema, options.validateOptions)

  this.validateLogin = validator({
    properties: {
      login: { 
        type: 'object',
        properties: { basic: { type: 'object' } }
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
AccountdownModel.prototype.save = function (key, data, callback) {
  if (typeof key === 'object') {
    callback = data
    data = key
    key = data[this._key]
  }

  if (!data[this._key]) return this.create(data, callback)
  return this.update(key, data, callback)
}

AccountdownModel.prototype.create = function (key, data, callback) {
  var self = this

  if (typeof key === 'object') {
    callback = data
    data = key
    key = data.value[this._key] = data.login.basic[this._key]
  }

  if (!key) var key = data.value[this._key] = data.login.basic[this._key] = cuid()
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
    self.indexer.addIndexes(data.value, function () {
      self.emit('create', data.value)
      callback(null, data.value)
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
   key = data.value[this._key]
 }

 this.get(key, function (err, model) {
   if (err || !model) return callback(new Error(self.modelName + ' not found with ' + this._key + ' ' + key))
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

AccountdownModel.prototype.changePassword = function (key, password, callback) {
  var self = this
  this.get(key, function (err, account) {
    if (err) return callback(err)
    self.remove(key, function (err) {
      var data = {
        login: { basic: { password: password } },
        value: account
      }
      
      data.login.basic[self._key] = key

      if (self.timestamps) data.updated = self.timestamp()
      self.create(data, function (err) {
        if (err) return callback(err)
        callback(null, data.value)
      })
    })
  })
}

AccountdownModel.prototype.changeUsername = function (key, username, callback) {
  var self = this
  this.get(key, function (err, account) {
    if (err) return callback(err)
    account.username = username
    self.put(key, account, function (err) {
      if (err) return callback(err)
      callback(null, account)
    })
  })
}

AccountdownModel.prototype.list =
AccountdownModel.prototype.createReadStream = function (options) {
  return this.accountdown.list(options)
}

AccountdownModel.prototype.findOne =function (identifier, callback) {
  if (isEmail(identifier)) return this.findOneBy('email', identifier, callback)
  return this.findOneBy('username', identifier, callback)
}

AccountdownModel.prototype.findOneBy = function (index, options, callback) {
  if (!this.indexer.indexes[index]) return callback(new Error(index + ' property not indexed'))
  this.indexer.indexes[index].findOne(options, callback)
}

AccountdownModel.prototype.isRegistered = function (type) {
  return !!this.accountdown._logins[type]
}