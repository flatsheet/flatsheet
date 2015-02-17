# Changelog

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
