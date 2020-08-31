const app = require('express')();
const server = app.listen(3000);
const io = require('socket.io').listen(server);

const deskState = require('./deskState');

const clientsHash = {};
const gamesHash = {};

// How to create a new desk state
// let newDesk = JSON.parse(JSON.stringify(deskState));

io.on('connection', (socket) => {
    console.log('a user connected: ', socket.id);
    clientsHash[socket.id] = socket;
    socket.emit('newClient', { clientId: socket.id });
    
    socket.on('createGame', (data) => {
        let gameId = guid();
        let clientId = data.clientId;
        let players = [clientId];
        gamesHash[gameId] = {
            gameId: gameId,
            state: {},
            hostId: clientId,
            players: players
        };
        let payLoad = {
            gameId: gameId,
            game: gamesHash[gameId]
        };

        console.log("new game: " + gameId);
        let client = clientsHash[clientId]
        client.emit("createGame", payLoad);
    });

    socket.on('joinGame', (data) => {
        console.log("joinGame");
        console.log(data);
        let gameId = data.gameId;
        let clientId = data.clientId;
        if(gamesHash[gameId]) {
            let game = gamesHash[gameId];
            if(clientsHash[clientId]) {
                game.players.push(clientId);
                let payLoad = {
                    gameId: gameId,
                    game: gamesHash[gameId]
                };
                console.log(gamesHash[gameId]);
                game.players.forEach(player => {
                    let client = clientsHash[player];
                    client.emit("joinGame", payLoad);
                });
            }
        }
    });

    socket.on('startGame', (data) => {
        let desk = JSON.parse(JSON.stringify(deskState));
        console.log(desk);
    });

    socket.on('disconnect', () => {
        console.log('user '+ socket.id +' disconnected');
        delete clientsHash[socket.id];
    });
});

function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
