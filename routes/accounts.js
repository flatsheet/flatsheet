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
  router.on(prefix + '/create-admin', handler.createAccountAsAdmin.bind(handler));

  /*
  *  Create an account
  */
  router.on(prefix + '/create', handler.createAccount.bind(handler));

  /*
  * Delete an account (admin only)
  */
  router.on(prefix + '/delete/:key', handler.deleteAccount.bind(handler));

  /*
  * Update an account
  */
  router.on(prefix + '/update/:key', handler.updateAccount.bind(handler));

  /*
   * Reset password
   */
  router.on(prefix + '/reset/:key', handler.passwordReset.bind(handler));

  /*
   * Accept reset password email
   */
  router.on(prefix + '/acceptReset', handler.passwordAcceptReset.bind(handler));

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