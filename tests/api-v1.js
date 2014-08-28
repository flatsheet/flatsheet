var request = require('request');


request({
  uri: 'http://127.0.0.1:3333/api/v1/sheets',
  method: 'post',
  json: true,
  body: {
    wee: 'butt patron',
    yep: 'pizza is good'
  }
}, function (err, res, body) {
  console.log(err, body)
});

/*
request({
  uri: 'http://127.0.0.1:3333/api/v1/sheets',
  method: 'get',
  json: true
}, function (err, res, body) {
  console.log(err, body)
});
*/
