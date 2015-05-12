var extend = require('extend');
var formBody = require('body/form');

module.exports = forms2accounts;

function forms2accounts (accountdown, opts) {
  if (!(this instanceof forms2accounts)) {
    return new forms2accounts(accountdown, opts);
  }
  if (!opts) opts = {};
  this.accountdown = accountdown;
  if (opts.login) {
    this.login = opts.login;
  } else {
    this.login = 'basic';
  }
}

forms2accounts.prototype.create = function (req, res, cb) {
  var self = this;
  formBody(req, res, function(err, body) {
    if (err) return logOrCallbackOnError(cb, err);
    // TODO: Use json-schema for input validation, or push this logic to the client.
    // LMS: I could not find a way to have checkboxes always post 'true' or 'false'
    // from the client, so we are relying on the server for the 'admin' field logic.
    body.admin = !!(body.admin);

    console.log("\nforms2accounts.create: creating account with body:", body);
    var account = {};
    account.value = body;
    self.addLoginToAccount(account, function (err, account) {
      if (err) return logOrCallbackOnError(cb, err);
      // TODO: Use json-schema for input validation, or push this logic to the client.
      // The password field should not be in the account's value, which should probably
      // be specified in a pre-defined schema
      delete account.value.password;
      self.accountdown.create(account.value.key, account, function (err) {
        if (err) logOrCallbackOnError(cb, err);
        if (cb) return cb(err, account.value);
      });
    });
  });
};

forms2accounts.prototype.update = function (req, res, key, cb) {
  var self = this;
  self.accountdown.get(key, function (err, existingAccountValue) {
    if (err) return console.log(err);
    formBody(req, res, function (err, body) {
      if (err) return console.log(err);

      // TODO: Use json-schema for input validation, or push this logic to the client.
      // LMS: I could not find a way to have checkboxes always post 'true' or 'false'
      // from the client, so we are relying on the server for the 'admin' field logic.
      console.log("forms2accounts.update: original body.admin:", body.admin);
      body.admin = !!(body.admin);
      console.log("forms2accounts.update: body:", body);
      console.log("forms2accounts.update: existingAccountValue:", existingAccountValue);
      // Create a new account value from the existing values, overwriting and
      // extending the old account fields with the new ones
      var updatedAccountValue = extend(existingAccountValue, body);
      console.log("forms2accounts.update: updatedAccountValue:", updatedAccountValue);

      // If the plugin login credentials have been updated, we need to delete
      // then recreate the account to do the update
      if ((body.username && body.username !== existingAccountValue.username) || body.password) {
        // If username or password has been modified, we need to add an
        // accountdown plugin field to recreating the account
        var updatedAccount = {};
        updatedAccount.value = updatedAccountValue;
        self.addLoginToAccount(updatedAccount, function (err, updatedAccount) {
          if (err) return logOrCallbackOnError(cb, err);
          // TODO: Use json-schema for input validation, or push this logic to the client.
          // The password field should not be in the account's value, which should probably
          // be specified in a pre-defined schema
          delete updatedAccount.value.password;
          self.accountdown.remove(updatedAccount.value.key, function (err) {
            if (err) return console.log("err while deleting old account:", err);
            self.accountdown.create(updatedAccount.value.key, updatedAccount, function (err) {
              if (err) logOrCallbackOnError(cb, err);
              if (cb) return cb(err, updatedAccount.value);
            });
          });
        });
      } else {
        self.accountdown.put(updatedAccountValue.key, updatedAccountValue, function (err) {
          if (err) return logOrCallbackOnError(cb, err);
          if (cb) return cb(err, updatedAccountValue);
        });
      }
    });
  });
};

forms2accounts.prototype.login = function (req, res, cb) {
  formBody(req, res, function (err, body) {
    if (body.usernameOrEmail) {
      body.usernameOrEmail = body.usernameOrEmail.trim();
    }
    server.accountdown.verify('basic', body, function (err, ok, id) {
      if (err) {
        console.error(err);
      } else if (!ok) {
        // TODO: notify user about incorrect password, and offer reset password option (issue #47)
      } else {
        server.auth.login(res, {key: id}, function (loginerr, data) {
          if (loginerr) console.error(loginerr);
        });
      }
      redirect(res, '/');
    });
  });
}

function logOrCallbackOnError (cb, err) {
  if (cb) return cb(err);
  return console.log(err);
}

forms2accounts.prototype.addLoginToAccount = function (account, cb) {
  if (this.login === 'basic') {
    account.login = {
      basic: {
        username: account.value.username,
        password: account.value.password
      }
    };
  } else {
    return cb("login plugin is not supported: ".concat(this.login));
  }
  return cb(null, account);
};
