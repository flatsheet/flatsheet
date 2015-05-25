var each = require('each-async')
var uuid = require('uuid').v1;
var path = require('path');
var dotenv = require('dotenv');
var fs = require('fs');

/*
 * Be sure to have the variable PASSWORD set in your .env file
 * (probably shouldn't check in the literal 'unguessable" password into version control)
 */
var flatsheet = require('../lib/index')({
  db: process.cwd() + '/data'
}, ready);

function ready () {

  var envFilePath = path.join(process.cwd(), '.env');
  var envFile = fs.readFileSync(envFilePath);
  this.secrets = dotenv.parse(envFile);
  var self = this;

  deleteSessionsResetsAndIndexes();
  var accountStream = flatsheet.accountdown.list();
  accountStream
    .on('data', function (account) {
      migrateAccount.bind(self)(account, sendPasswordResetEmail);
    })
    .on('error', function (err) {
      return console.log(err);
    })
    .on('end', function () {
      console.log("Finished updating account stream");
    });
}

var migrateAccount = function (oldAccount, sendPasswordResetEmail) {
  var self = this;
  var uuidRegex = /^([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$/;
  if (!uuidRegex.test(oldAccount.key) || !oldAccount.value.key) {
    console.log("Account key is not a uuid", oldAccount.key);

    flatsheet.accountdown.get(oldAccount.key, function (err, accountValue) {
      if (err) return console.log("error retrieving test account:", err);
      var newAccountKey = uuid();
      accountValue['key'] = newAccountKey;

      var updatedAccount = {
        login: {
          basic: {
            uuid: accountValue.key,
            password: self.secrets.PASSWORD
          }
        },
        value: accountValue
      };

      flatsheet.accountdown.remove(oldAccount.key, function (err) {
        if (err) return console.log("err while deleting old account:", err);
        console.log("updates:migrateAccount: account removed:", oldAccount.key);
        flatsheet.accountdown.create(newAccountKey, updatedAccount, function (err) {
          if (err) return console.log("err while putting in new account:", err);
          flatsheet.accountsIndexes.addIndexes(accountValue);
          sendPasswordResetEmail(updatedAccount);
        });
      });
    });

  } else {
    console.log("Account key is a valid uuid:", oldAccount.key)
  }
}

var sendPasswordResetEmail = function (account) {
  var token = require('crypto').randomBytes(32).toString('hex');
  var opts = { email: account.value.email, accepted: false };

  flatsheet.resets.put(token, opts, function (err) {
    if (err) return console.log(err);

    var data = {
      url: flatsheet.site.url + '/accounts/acceptReset?username=' + account.value.username +
      '&key=' + account.value.key + '&token=' + token,
      from: flatsheet.site.email,
      fromname: flatsheet.site.contact
    };

    var message = {
      to: account.value.email,
      from: flatsheet.site.email,
      fromname: flatsheet.site.contact,
      subject: 'Password reset needed for your Flatsheet account',
      text: flatsheet.render('password-reset-email-for-account-updates', data),
      html: flatsheet.render('password-reset-email-for-account-updates', data)
    };

    flatsheet.email.sendMail(message, function (err, info) {
      if (err) return console.log(err);
      console.log("Email sent to account username:", account.value.username);
    });
  });
}

var deleteSessionsResetsAndIndexes = function () {
  var sessionRegex = /^!sessions!/;
  var resetsRegex = /^!resets!/;
  var accountIndexesRegex = /^!account-indexes!/;
  flatsheet.db.createReadStream()
    .on('data', function (data) {
      // Delete all session rows
      if (sessionRegex.test(data.key)) {
        console.log("deleting session:", data);
        // delete row
        flatsheet.db.del(data.key, function (err) {
          if (err) return console.log(err);
        });
        // Delete all reset rows
      } else if (resetsRegex.test(data.key)) {
        console.log("deleting account reset row:", data);
        flatsheet.db.del(data.key, function (err) {
          if (err) return console.log(err);
        });
        // Delete all account-index rows
      } else if (accountIndexesRegex.test(data.key)) {
        console.log("deleting account-index row:", data);
        flatsheet.db.del(data.key, function (err) {
          if (err) return console.log(err);
        });
      }
    })
    .on('error', function(err) {
      console.log(err);
    })
    .on('done', function () {
      console.log("done iterating over stream");
    })
}
