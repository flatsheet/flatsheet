var each = require('each-async')
var uuid = require('uuid').v1;
var path = require('path');
var dotenv = require('dotenv');
var fs = require('fs');
var through = require('through2').obj;


var UUID_REGEX = /^([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$/;

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
  updateAccountStream.bind(self)(flatsheet.accountdown.list(), function () {
    console.log("\nBegin sheets updates...");
    updateSheetsStream.bind(self)(flatsheet.sheets.list());
  });
}

function updateAccountStream (accountStream, cb) {
  var self = this;
  accountStream.pipe(through(function (account, _, next) {
    migrateAccount.bind(self)(account, sendPasswordResetEmail.bind(self), next);
  }))
    .on('data', function (data) {
      console.log("reading account stream:", data);
    })
    .on('err', function (err) {
      console.log("Error reading account stream:", err);
    })
    .on('end', function () {
      console.log("Finished reading account stream");
      cb();
    })
}

function updateSheetsStream (sheetStream) {
  var self = this;
  sheetStream
    .on('data', function (sheet) {
      migrateSheet.bind(self)(sheet);
    })
    .on('error', function (err) {
      return console.log(err);
    })
    .on('end', function () {
      console.log("Finished updating sheet stream");
    });
}

var migrateSheet = function (sheet) {
  usernameToUuidPermissionsHelper(sheet.owners, function (err, ownerUuids) {
    if (err) return console.log("update.usernameToUuid: owner eachAsync loop err:", err);
    console.log("updated sheet.owners:", ownerUuids);
    sheet.owners = ownerUuids;
    usernameToUuidPermissionsHelper(sheet.editors, function(err, editorUuids) {
      if (err) return console.log("update.usernameToUuid: editor eachAsync loop err:", err);
      console.log("updated sheet.editors:", editorUuids);
      sheet.editors = editorUuids;
      flatsheet.sheets.put(sheet, function (err, newSheet) {
        if (err) return console.log("Update.migrateSheet: could not put new sheet, err:", err)
        console.log("newSheet.owners:", newSheet.owners);
        console.log("newSheet.editors:", newSheet.editors);
      });
    });
  });
}

var usernameToUuidPermissionsHelper = function (usernameDict, cb) {
  var uuidDict = {};
  var usernameList = Object.keys(usernameDict);
  each(usernameList, function(username, _, next) {
    // check that the array value is not already a uuid:
    if (!UUID_REGEX.test(username)) {
      console.log("update.migrateSheet: getting key from username:", username);
      // Get uuid from username
      flatsheet.accountsIndexes.getKeyFromUsername(username, function (err, account) {
        if (err) return console.log("update.usernameToUuid: cannot get key from " +
          "username:", err);
        uuidDict[account.key] = true;
        next();
      });
    }
  }, function (err) {
    if (err) return cb(err);
    console.log("update.usernameToUuid: new uuid dict:", uuidDict);
    return cb(null, uuidDict);
  });
}

var migrateAccount = function (oldAccount, sendPasswordResetEmail, next) {
  var self = this;
  if (!UUID_REGEX.test(oldAccount.key) || !oldAccount.value.key) {
    console.log("Migrating account:", oldAccount.key);

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
          sendPasswordResetEmail.bind(self)(updatedAccount, next);
        });
      });
    });

  } else {
    console.log("Account not migrated (already has a valid uuid):", oldAccount.key);
  }
}

var sendPasswordResetEmail = function (account, next) {
  var self = this;
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
      // TODO: reset this for production
      subject: 'Password reset needed for your Flatsheet account',
      //subject: 'Password reset needed for your Flatsheet account:' + account.value.email,
      text: flatsheet.render('password-reset-email-for-account-updates', data),
      html: flatsheet.render('password-reset-email-for-account-updates', data)
    };

    //// uncomment this for testing (sends emails to a email, not to members)
    //// Safety check to mask emails when testing the migration
    //if (!self.secrets.ACTIVATE_EMAIL_MIGRATION) {
    //  message.to = 'luke.swart@gmail.com'
    //}
    //console.log("Update.sendResetEmail: email that will receive account change info:", message.to);

    flatsheet.email.sendMail(message, function (err, info) {
      if (err) return console.log(err);
      console.log("Update.sendResetEmail: Email sent to account email:", account.value.email);
      // info is `{ message: 'success'}`
      console.log("Update.sendresetEmail: Email delivery status:", info.message);
      return next();
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
