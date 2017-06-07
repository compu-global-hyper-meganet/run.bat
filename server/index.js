var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// game state
var numberOfUsers = 0;
var gameActive = false;
var players = [];


function addPlayer(id) {
  var player = {
    id: id,
    defence: 10,
    active: false
  };
  players.push(player);
}

// event emitter
io.on('connection', function(socket){

  var player = null;
  var opponent = null;

  socket.on('join', function() {

    addPlayer(socket.id);
    player = players.find(x => x.id === socket.id);

    if(player.active) {
      return;
    }
    numberOfUsers++;
    player.active = true;

    io.to(player.id).emit('message', 'Attempting connection...');
    io.to(player.id).emit('message', 'Initialising defence...');
    io.to(player.id).emit('action', { type: 'setDefence', value: player.defence });
    io.to(player.id).emit('message', 'Defence grid active');

    if(numberOfUsers === 2) {
      gameActive = true;
      io.emit('message', 'Two players have joined the game, game starting...');
    }
  });

  socket.on('leave', function() {
    //console.log(socket.id +' player request to leave game');
    numberOfUsers--;
    player.active = false;
    io.to(player.id).emit('message', 'Disconnected from target, you lose.');

    if(numberOfUsers < 2) {
      io.to(opponent.id).emit('message', 'Target has disconnected, you win!');
      gameActive = false;
    }
  });

  socket.on('command', function(cmd){

    if(!gameActive) {
      return;
    }

    opponent = players.find(x => x.id !== socket.id);

    switch (cmd) {
      case 'cls':
        socket.broadcast.emit('cls');
        break;
      case 'firewall':
        if(player.defence < 10) {
          player.defence ++;
          io.to(player.id).emit('message', 'Defences increased to ' + player.defence);
          io.to(player.id).emit('action', { type: 'setDefence', value: player.defence });
        } else {
          io.to(player.id).emit('message', 'Defences at maximum, push the attack!');
        }
        break;
      case 'virus':
        opponent.defence --;
        io.to(opponent.id).emit('action', { type: 'setDefence', value: opponent.defence });
        if(opponent.defence === 0) {
          io.to(player.id).emit('message', 'Opponents defences breached, you win!');
          io.to(opponent.id).emit('message', 'Your defences are breached, you lose.');
        } else {
          io.to(player.id).emit('message', 'Virus transmitted');
          io.to(opponent.id).emit('message', 'Under attack! Defence grid at ' + opponent.defence);
        }
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