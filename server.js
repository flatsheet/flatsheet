var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var randomColor = require('random-color');
var users = {}

app.use(express.static(__dirname + '/bundle'));

app.get('/', function (req, res) {
  res.sendfile('index.html');
});

app.get('/:id', function (req, res) {

});

io.on('connection', function (socket) {
  users[socket.id] = { color: randomColor() };

  socket.on('change:rows', function (keypath, value) {
    socket.broadcast.emit('change', keypath, value);
  });

  socket.on('cell-focus', function (cell) {
    io.emit('cell-focus', cell, users[socket.id].color);
  });

  socket.on('cell-blur', function (cell) {
    io.emit('cell-blur', cell);
  });
});

http.listen(process.env.PORT || 3000, function () {
  console.log('listening on *:3000');
});
