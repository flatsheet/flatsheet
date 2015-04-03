exports.install = function (server, prefix) {
  var handler = server.accounts;
  prefix = prefix || '/accounts';
  handler.prefix = prefix;

  /*
  * Get list of accounts
  */

  server.route(prefix, handler.getListOfAccounts.bind(handler));
  //server.route(prefix, function(req, res) {
  //  server.accounts.getListOfAccounts(req, res);
  //});

  /*
  *  Sign in
  */

  server.route(prefix + '/sign-in', handler.signIntoAccount.bind(handler));
  //server.route(prefix + '/sign-in', function(req, res) {
  //  server.accounts.signIntoAccount(req, res);
  //});


  /*
   *  Create an admin account (admin only)
   */

  server.route(prefix + '/create-admin', handler.createAdminAccount.bind(handler));
  //server.route(prefix + '/create-admin', function(req, res) {
  //  server.accounts.createAdminAccount(req, res);
  //});

  /*
  *  Create an account
  */

  server.route(prefix + '/create', handler.createAccount.bind(handler));
  //server.route(prefix + '/create', function(req, res) {
  //  server.accounts.createAccount(req, res);
  //});

  /*
   * Delete an account (admin only)
   */

  server.route(prefix + '/delete/:username', handler.deleteAccount.bind(handler));
  //server.route(prefix + '/delete/:username', function(req, res, opts) {
  //  server.accounts.deleteAccount(req, res, opts);
  //});

  /*
  * Update an account
  */

  server.route(prefix + '/update/:username', handler.updateAccount.bind(handler));
  //server.route(prefix + '/update/:username', function(req, res, opts) {
  //  server.accounts.updateAccount(req, res, opts);
  //});

  /*
  * Invite users to create accounts
  */

  server.route(prefix + '/invite', handler.invite.bind(handler));
  //server.route(prefix + '/invite', function(req, res) {
  //  server.accounts.invite(req, res);
  //});


  /*
  * Accept invitation
  */

  server.route(prefix + '/accept', handler.acceptInvite.bind(handler));
  //server.route(prefix + '/accept', function(req, res) {
  //  server.accounts.acceptInvite(req, res);
  //});

};
