# flatsheet

A multi-user, real-time editor for tabular data.

## Goal

Allow multiple users to edit tabular data in real time, and get a json file that can be downloaded or integrated with a server API.

## Refactor notes

### Todos:

Open issues represent current todo list: [github.com/flatsheet/flatsheet/issues](http://github.com/flatsheet/flatsheet/issues)

## Installation

- Clone this repository `git@github.com:flatsheet/flatsheet.git`
- Change directory `cd flatsheet`
- Install dependencies with `npm install`

## Getting started
- Follow above installation instructions.
- Navigate to the root directory of the project and run `mkdir data` to create the directory the db will live in.
- Right now a sheet is added through the command-line by importing a JSON file (soon to be improved with UI, CSV import, etc.)
- Import a sheet like this: `./bin/flatsheet sheet add tests/data/coworking.json`
- Then you can run `./bin/flatsheet sheet list` to see that your sheet has been added.
- Next, create an admin account by running `./bin/flatsheet account create-admin`. You'll be prompted for email, username, & password.
- You can run `./bin/flatsheet account list` to see that your admin account was created.
- Now run `npm start` to start the server.
- In development you can watch the css & js using `npm run watch`.
- Go to `http://127.0.0.1:3333` and log in with the admin account credentials.
- You should now see the example data set, and be able to click it to go to the editor.
- NOTE: the editor in this version is not currently fully functional!

## Support

This project is supported in part by a [code sprint grant from OpenNews](http://opennews.org/codesprints.html). More info [at the Flatsheet blog](http://flatsheet.io/blog/getting-flatsheet-to-v1-with-help-from-opennews/).

## License
MIT
