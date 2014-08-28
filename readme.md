# flatsheet-editor

A multi-user, real-time editor for tabular data.

## Goal

Allow multiple users to edit tabular data in real time, and get a json file that can be downloaded or integrated with a server API.

## Refactor notes

### Todos:

- fix npm run scripts
- make websockets stuff come back
- make sure that api requests are authenticated when needed
- filter users based on if they have edit permissions
- update flatsheet-javascript-client for v2 api
- sheet/:id/view view
- invite users route, view
- set up sendgrid or maybe emailjs module for user invites
- revise bin scripts to allow for things like creating admin account, importing json/csv files

## Support
This project is supported in part by a [code sprint grant from OpenNews](http://opennews.org/codesprints.html). More info [at the Flatsheet blog](http://flatsheet.io/blog/getting-flatsheet-to-v1-with-help-from-opennews/).

## License
MIT
