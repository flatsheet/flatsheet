exports.install = function (server, prefix) {
  var handler = server.accounts;
  prefix = prefix || '/accounts';
  handler.prefix = prefix;

  /*
  * Get list of accounts
  */

  server.route(prefix, handler.getListOfAccounts.bind(handler));

  /*
  *  Sign in
  */

  server.route(prefix + '/sign-in', handler.signIntoAccount.bind(handler));

  /*
   *  Create an admin account (admin only)
   */

  server.route(prefix + '/create-admin', handler.createAdminAccount.bind(handler));

  /*
  *  Create an account
  */

  server.route(prefix + '/create', handler.createAccount.bind(handler));

  /*
   * Delete an account (admin only)
   */

  server.route(prefix + '/delete/:username', handler.deleteAccount.bind(handler));

  /*
  * Update an account
  */

  server.route(prefix + '/update/:username', handler.updateAccount.bind(handler));

  /*
  * Invite users to create accounts
  */

  server.route(prefix + '/invite', handler.invite.bind(handler));

  /*
  * Accept invitation
  */

  server.route(prefix + '/accept', handler.acceptInvite.bind(handler));

};
