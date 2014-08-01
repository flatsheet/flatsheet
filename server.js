var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/bundle'));

app.get('/', function (req, res) {
  res.sendfile('index.html');
});

app.get('/:id', function (req, res) {

});

io.on('connection', function (socket) {
  socket.on('cell-focus', function (cell) {
    io.emit('cell-focus', cell);
  });

  socket.on('change', function (data) {
    socket.broadcast.emit('change', data);
  });

  socket.on('cell-blur', function (cell) {
    io.emit('cell-blur', cell);
  });

  socket.on('disconnection', function () {
    console.log('disconnector')
  });
});

http.listen(process.env.PORT || 3000, function () {
  console.log('listening on *:3000');
});
