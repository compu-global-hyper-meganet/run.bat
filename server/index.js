var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// game state
var numberOfUsers = 0;
var gameActive = false;

// event emitter
io.on('connection', function(socket){

  console.log('a user connected ' + socket.id);
  var hasJoined = false;

  socket.on('join', function() {
    if(hasJoined) {
      return;
    }
    //console.log(socket.id +' player request to join game');
    numberOfUsers++;
    hasJoined = true;

    io.to(socket.id).emit('command', 'Attempting connection...');

    if(numberOfUsers === 2) {
      var msg = "Two players have joined the game, game starting..."
      io.emit('command', msg);
      gameActive = true;
    }
  });

  socket.on('leave', function() {
    //console.log(socket.id +' player request to leave game');
    numberOfUsers--;
    hasJoined = false;
    io.to(socket.id).emit('command', 'Disconnected from target, you lose.');

    if(numberOfUsers < 2) {
      var msg = "Target has disconnect, you win!"
      socket.broadcast.emit('command', msg);
      gameActive = false;
    }
  });

  socket.on('command', function(cmd){

    if(!gameActive) {
      return;
    }
    //console.log('command: ' + cmd);

    socket.broadcast.emit('command', cmd);

    switch (cmd) {
      case 'cls':
        socket.broadcast.emit('cls');
        break;

      default:
        break;
    }


  });

  socket.on('disconnect', function(){
    console.log('user disconnected ' + socket.id);
  });

});


http.listen(3000, function(){
  console.log('listening on *:3000');
});