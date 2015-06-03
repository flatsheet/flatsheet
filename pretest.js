var
  fs = require('fs');

// Ignores all errors, to achieve ignoring EEXIST.
fs.mkdir('./tmp', function () {});
