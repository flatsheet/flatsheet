var Emitter = require('events').EventEmitter
var inherits = require('util').inherits
var validator = require('is-my-json-valid')
var indexer = require('level-simple-indexes')
var sublevel = require('subleveldown')
var extend = require('extend')
var cuid = require('cuid')

module.exports = AccountdownModel

/*
* a wrapper around accountdown that provides a few additional features
*/

function AccountdownModel (accountdown, opts) {
  if (!(this instanceof AccountdownModel)) return new AccountdownModel(db, opts)
  Emitter.call(this)
  opts = opts || {}
  var self = this

  this.accountdown = accountdown
  this.modelName = opts.modelName || 'accounts'

  this.indexer = opts.indexer
}

AccountdownModel.prototype.create = function () {
  
}

AccountdownModel.prototype.get = function () {
  
}

AccountdownModel.prototype.update = function () {
  
}

AccountdownModel.prototype.delete = function () {
  
}

AccountdownModel.prototype.resetPassword = function () {
  
}

AccountdownModel.prototype.changeUsername = function () {
  
}