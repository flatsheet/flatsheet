# flatsheet

> A realtime editor for curating data as a team. [flatsheet.io](http://flatsheet.io)

- **[flatsheet on Github](http://github.com/flatsheet)**
- **[Discussions, tasks, and issue reporting](http://github.com/flatsheet/flatsheet/issues)**
- **[Chat on Gitter](https://gitter.im/flatsheet/flatsheet)**
- **[Contributing guidelines](CONTRIBUTING.md)**

[![Join the chat at https://gitter.im/flatsheet/flatsheet](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/flatsheet/flatsheet?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Current status

This version of Flatsheet is an **in-progress** rewrite using Node.js. The first version of Flatsheet was a [Ruby on Rails prototype](https://github.com/flatsheet/flatsheet-prototype).

Many aspects of the project are incomplete, but things are far enough along that it will be useful if you want to install it and **experiment in a development environment**.

Want to see an early demo of the real-time editor? Go here: http://flatsheet-realtime.herokuapp.com/

### Todos:

Open issues represent current todo list: [github.com/flatsheet/flatsheet/issues](http://github.com/flatsheet/flatsheet/issues)


## Getting started

There are two ways to get flatsheet running:

## Option 1: clone the flatsheet repository

Cloning the repo is best for testing things out & developing flatsheet, but works fine for other purposes. You just have to be prepared to manually pull & merge changes to your server.

### Steps:

- clone this repo: `git clone git@github.com:flatsheet/flatsheet.git`
- change directory: `cd flatsheet`
- run `npm install`
- next you can follow the readme from here: https://github.com/flatsheet/flatsheet#create-an-admin-user

## Option 2: use flatsheet as an npm dependency

This is a good option for when you're using flatsheet in production, because you can make use of npm to install and update flatsheet.

### Steps:

- Create a directory name `flatsheet` for your project (or whatever you like)
- Change directory `cd flatsheet`
- Create a package.json file with `npm init`
- Install flatsheet with npm: `npm install flatsheet --save`
- Install the response module: `npm install response --save`

### File/folder setup
- Create a folder named `data`: `mkdir data`
- Create a app.js file with this code:

```javascript
var server = require('flatsheet')({
  site: {
    title: 'flatsheet',
    email: 'hi@example.com',
    url: 'http://127.0.0.1:3333',
    contact: 'your full name'
  },
  db: __dirname + '/data'
});

server.listen();
```

- Create a .env file for secret config like sendgrid username/password:

```
SENDGRID_USER=yourusername
SENDGRID_PASS=yourpassword
```

- Add a `flatsheet` script and a `start` script to the `scripts` field in your package.json file:

```json
"scripts": {
  "flatsheet": "flatsheet",
  "start": "node app.js"
},
```

- So your full package.json file should look something like this:

```
{
  "name": "flatsheet-example",
  "version": "1.0.0",
  "description": "",
  "main": "app.js",
  "scripts": {
    "flatsheet": "flatsheet",
    "start": "node app.js"
  },
  "author": "",
  "license": "ISC"
}
```

- next create an admin user:


### Create an admin user
- Create an admin account by running `npm run flatsheet accounts create-admin`. You'll be prompted for email, username, & password.
- You can run `npm run flatsheet accounts list` to see that your admin account was created.

### Start the server
- Now run `npm start` to start the server.
- In development you can watch the css & js using `npm run watch`.
- In development you can debug runnig `npm run-script debug`. You add breakpoints in the code with `debugger`
- Go to `http://127.0.0.1:3333` and log in with the admin account credentials.

### Create a sheet
- Log in
- Click the **New blank sheet** button
- Fill out the name and description

### Invite users
- Navigate to `http://127.0.0.1:3333/accounts/invite`
- Enter email addresses, one address per line
- Click "Send invitation"
- Users will receive an email with a link they can click to create accounts

## Support

This project is supported in part by a [code sprint grant from OpenNews](http://opennews.org/codesprints.html).

More info [at the Flatsheet blog](http://flatsheet.io/blog/getting-flatsheet-to-v1-with-help-from-opennews/).

## License

[MIT](LICENSE.md)
