var extend = require('extend');

module.exports = function (io, server) {
  var rooms = {};

  io.on('connection', function (socket) {
    socket.on('room', function (room) {
      socket.join(room);

      if (!rooms[room]) rooms[room] = { users: {} };

      socket.on('user', function (user) {
        if (!rooms[room].users[socket.id]) {
          rooms[room].users[socket.id] = user;
        }
        io.to(room).emit('update-users', rooms[room].users);
      });

      server.sheets.get(room, function (err, sheet) {
        socket.on('change', function (change, rows, sort) {
          console.log('socket.on change', change, rows)

          var data = sheet.metadata
          data.rows = rows
          console.log('socket.on change sheet object', sheet)
          server.sheets.update(room, data, function (err, sheet) {
            if (err) console.error(err);
            socket.broadcast.to(room).emit('change', change, rows, sort);
          });
        });

        socket.on('sheet-details', function (change) {
          sheet.metadata = extend(sheet.metadata, change);
          console.log('socket.on sheet-details', sheet.metadata)
          server.sheets.update(sheet, function (err) {
            if (err) console.error(err);
            socket.broadcast.to(room).emit('sheet-details', change);
          });
        });

        socket.on('cell-focus', function (cell, color) {
          io.to(room).emit('cell-focus', cell, color);
        });

        socket.on('cell-blur', function (cell) {
          io.to(room).emit('cell-blur', cell);
        });
      });

      socket.on('disconnect', function () {
        io.to(room).emit('cell-blur');
        delete rooms[room].users[socket.id];
        io.to(room).emit('update-users', rooms[room].users);
      });
    });
  });
}