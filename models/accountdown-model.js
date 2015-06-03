module.exports = AccountdownModel

/*
* a wrapper around accountdown that provides a few additional features
*/

function AccountdownModel (accountdown, opts) {
  if (!(this instanceof AccountdownModel)) return new AccountdownModel(db, opts)
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