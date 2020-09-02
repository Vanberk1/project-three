const app = require('express')();
const server = app.listen(3000);
const io = require('socket.io').listen(server);

const deskData = require('./deskData');

const clientsHash = {};
const gamesHash = {};

io.on('connection', (socket) => {
    console.log('a user connected: ', socket.id);
    clientsHash[socket.id] = socket;
    socket.emit('newClient', { clientId: socket.id });
    
    socket.on('createGame', (data) => {
        console.log("createGame");
        let gameId = guid();
        let clientId = data.clientId;
        let clients = [clientId];
        gamesHash[gameId] = {
            gameId: gameId,
            hostId: clientId,
            clients: clients
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
        let gameId = data.gameId;
        let clientId = data.clientId;
        if(gamesHash.hasOwnProperty(gameId)) {
            let game = gamesHash[gameId];
            if(clientsHash.hasOwnProperty(clientId)) {
                game.clients.push(clientId);
                console.log("Client " + clientId + "joined to game " + gameId);
                let payLoad = {
                    gameId: gameId,
                    game: gamesHash[gameId]
                };
                game.clients.forEach(clientId => {
                    let gameClient = clientsHash[clientId];
                    gameClient.emit("joinGame", payLoad);
                });
            }
        }
    });

    socket.on('startGame', (data) => {
        let desk = JSON.parse(JSON.stringify(deskData));
        let gameId = data.gameId;
        if(gamesHash.hasOwnProperty(gameId)) {
            let game = gamesHash[gameId];
            let clients = game.clients;

            let playersCards = {};
            clients.forEach(clientId => { 
                playersCards[clientId] = {
                        hand: [],
                        lookDown: [],
                        lookUp: []
                };
                for(let j = 0; j < 3; j++) {
                    let cardIndex = Math.floor(Math.random() * desk.desk.length);
                    playersCards[clientId].hand.push(desk.desk.splice(cardIndex, 1)[0]);
                }
    
                for(let j = 0; j < 3; j++) {
                    let cardIndex = Math.floor(Math.random() * desk.desk.length);
                    playersCards[clientId].lookDown.push(desk.desk.splice(cardIndex, 1)[0]);
                }
    
                for(let j = 0; j < 3; j++) {
                    let cardIndex = Math.floor(Math.random() * desk.desk.length);
                    playersCards[clientId].lookUp.push(desk.desk.splice(cardIndex, 1)[0]);
                }
            });
            
            let gameState = {
                desk: desk.desk,
                pile: [],
                discarted: [],
                playersCards: playersCards
            };

            let cardIndex = Math.floor(Math.random() * gameState.desk.length);
            gameState.top = gameState.desk.splice(cardIndex, 1)[0];
            gameState.pile.push(gameState.desk.splice(cardIndex, 1)[0]);

            game.state = gameState;
    
            clients.forEach(clientId => {
                let allHandCards = game.state.playersCards;
                let clientCards = allHandCards[clientId];
                let opponentsCards = []
                for (const id in allHandCards) {
                    if(id != clientId) {
                        opponentsCards.push({
                            opponentHandCount: allHandCards[id].hand.length,
                            opponentLookDownCount: allHandCards[id].lookDown.length,
                            opponentLookUp: allHandCards[id].lookUp
                        });
                    }
                }
                
                let clientState = {
                    clientCards: clientCards,
                    opponentsCards: opponentsCards,
                    pile: game.state.pile,
                    top: game.state.top
                }
                let payload = {
                    gameId: game.gameId,
                    clientState: clientState
                }
                clientsHash[clientId].emit("startGame", payload);
            });
        }
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
