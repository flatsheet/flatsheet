var each = require('each-async')
var uuid = require('uuid').v1;
var uuidV4 = require('uuid').v4;

var flatsheet = require('../lib/index')({
  db: process.cwd() + '/data'
}, ready);

function ready () {
  var accountStream = flatsheet.accountdown.list();
  accountStream
    .on('data', function (account) {
      updateAccount(account, sendPasswordResetEmail);
    })
    .on('error', function (err) {
      return console.log(err);
    })
    .on('end', function () {
      console.log("Finished updating account stream");
      // delete all sessions associated with the account
      removeSessionsAndResets();
    });
}

var updateAccount = function (account, sendPasswordResetEmail) {
  var uuidRegex = /^([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$/;
  if (!uuidRegex.test(account.key) || !account.value.uuid) {
    console.log("Account key is not a uuid", account.key);

    flatsheet.accountdown.get(account.key, function (err, accountValue) {
      if (err) return console.log("error retrieving test account:", err);
      var accountUuid = uuid();
      accountValue['uuid'] = accountUuid;

      var updatedAccount = {
        login: {
          basic: {
            username: accountValue.username,
            // User will be prompted via email to reset their password
            password: process.env.PASSWORD
          }
        },
        value: accountValue
      };

      flatsheet.accountdown.remove(account.key, function (err) {
        if (err) return console.log("err while deleting old account:", err);
        flatsheet.accountdown.create(accountUuid, updatedAccount, function (err) {
          if (err) return console.log("err while putting in new account:", err);
          sendPasswordResetEmail(updatedAccount);
        });
      });
    });

  } else {
    console.log("Account key is a valid uuid:", account.key)
  }
}

var sendPasswordResetEmail = function (account) {
  var token = require('crypto').randomBytes(32).toString('hex');
  var opts = { email: account.value.email, accepted: false };

  flatsheet.resets.put(token, opts, function (err) {
    if (err) return console.log(err);

    var data = {
      url: flatsheet.site.url + '/accounts/acceptReset?username=' + account.value.username +
      '&uuid=' + account.value.uuid + '&token=' + token,
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

var removeSessionsAndResets = function () {
  var sessionRegex = /^!sessions!/;
  var resetsRegex = /^!resets!/;
  flatsheet.db.createReadStream()
    .on('data', function (data) {
      if (sessionRegex.test(data.key)) {
        console.log("deleting session:", data);
        // delete row
        flatsheet.db.del(data.key, function (err) {
          if (err) return console.log(err);
        });
      } else if ( resetsRegex.test(data.key)) {
        console.log("deleting account reset row:", data);
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
