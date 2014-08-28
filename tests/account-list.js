var request = require('request');

request({
  uri: 'http://127.0.0.1:3333/accounts',
  method: 'get',
  json: true
}, function (err, res, body) {
  console.log(err, body)
});
