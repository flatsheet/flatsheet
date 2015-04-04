# Changelog

## v0.9.2 – April 4, 2015
- fix invites bug

## v0.9.1 – April 3, 2015
- fix `flatsheet` command so it works with accounts refactor

## v0.9.0 – April 3, 2015
- refactor accounts routes into a handlers file and a routes file
- allow custom views so that built-in views can be overriden

## v0.8.0 - March 28, 2015
- sheets now have access control. admins have access to all sheets, users can invite other users to edit their sheets through the sheet settings modal that is added in this version

## v0.7.2 - March 27, 2015
- fix issue with db not being accessible when using flatsheet as a module

## v0.7.1 - March 27, 2015
- limit height of table so horizontal scroll is visible
- reduce whitespace on sheet edit page
- improve html of forms, start using csskit for base css of forms & buttons

## v0.7.0 - March 3, 2015
- revise cli tool: make subcommands plural to they are `accounts` & `sheets`

## v0.6.3 - March 3, 2015
- use 'auth.login' in `/accounts/invite` POST

## v0.6.2 - March 3, 2015
- fix `/accounts/accept` route to be a plural `accounts`

## v0.6.1 - March 3, 2015
- Fix login error: password check
- add CONTRIBUTING.md and LICENSE.md
- small route fixes

## v0.6.0 - February 26, 2015
- make accounts, sheets, sessions routes plural
- update accountdown to ^4.0.0
- allow admins to create, edit, and delete accounts through the ui

## v0.5.2 - February 18, 2015
- Rename util to lib
- move index.js into lib folder
- rename server.js, the example usage of the module, to app.js
- bring back ability to set path to db when using flatsheet as required module

## v0.5.1 - February 18, 2015
- Fix some issues with module names being uppercased, which ubuntu is not fond of.

## v0.5.0 - February 16, 2015
- fixed some install instructions in the readme
- switched from level-sublevel to subleveldown
- switched from level-session to cookie-auth
- added 404 route/view
- use process.env if .env file does not exist
- provide sheet name/description defaults for csv import
- add `flatsheet` to npm scripts so you can run `npm run flatsheet SUBCOMMAND` when you've cloned the repo with git.

## v0.4.0 - December 17, 2014
- allow creating a new sheet by importing a csv

## v0.3.2 - December 17, 2014
- pin level-session to v0.3.1 to avoid incompatibility issues

## v0.3.1 - December 14, 2014
- rename api client package to `flatsheet-api-client`
- fix flatsheet-api-client dependency in `browser/sheet.js`

## v0.3.0 - December 11, 2014
- npm package now named `flatsheet`
- create `server.js` file in directory root so you can get flatsheet running by doing:
  - `git clone`
  - `npm install`
  - `npm start`

## v0.2.8 - November 25, 2014
- add api button to edit view
- update fontawesome to v4.2.0

## v0.2.7 - November 20, 2014
- allow cors requests

## v0.2.6 - November 14, 2014
- now uses minimist for `./bin/flatsheet`
- add the `addView()` method`

## v0.2.2 - November 14, 2014
- now using level-party
- add back public folder

## v0.2.0 - November 14, 2014
- Now requirable & distributed on npm as `flatsheet-server`

## v0.1.0 - November 11, 2014
- Basic functionality works!
- Rewrite from rails/backbone prototype to node/socket.io basically complete!
