var Router = require('match-routes');

/**
* Accounts API Handler
*/
module.exports = function (server, prefix) {
  var handler = require('../handlers/accounts')(server);
  prefix = prefix || '/accounts';
  handler.prefix = prefix;
  var router = Router();

  /*
  * Get list of accounts
  */
  router.on(prefix, handler.getListOfAccounts.bind(handler));

  /*
  *  Sign in
  */
  router.on(prefix + '/sign-in', handler.signIntoAccount.bind(handler));

  /*
  *  Create an admin account (admin only)
  */
  router.on(prefix + '/create-admin', handler.createAdminAccount.bind(handler));

  /*
  *  Create an account
  */
  router.on(prefix + '/create', handler.createAccount.bind(handler));

  /*
  * Delete an account (admin only)
  */
  router.on(prefix + '/delete/:username', handler.deleteAccount.bind(handler));

  /*
  * Update an account
  */
  router.on(prefix + '/update/:username', handler.updateAccount.bind(handler));

  /*
  * Invite users to create accounts
  */
  router.on(prefix + '/invite', handler.invite.bind(handler));

  /*
  * Accept invitation
  */
  router.on(prefix + '/accept', handler.acceptInvite.bind(handler));

  return router;
}