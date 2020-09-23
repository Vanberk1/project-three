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
        let clients = {};
        clients[clientId] = 1;
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
        let client = clientsHash[clientId];
        client.emit("createGame", payLoad);
    });

    socket.on('joinGame', (data) => {
        console.log("joinGame");
        let gameId = data.gameId;
        let clientId = data.clientId;
        if(gamesHash.hasOwnProperty(gameId)) {
            let game = gamesHash[gameId];
            if(clientsHash.hasOwnProperty(clientId)) {
                let turn = Object.keys(game.clients).length + 1;
                game.clients[clientId] = turn;
                console.log("Client " + clientId + "joined to game " + gameId);
                let payLoad = {
                    gameId: gameId,
                    game: game
                };
                for(const clientId in game.clients) {
                    clientsHash[clientId].emit("joinGame", payLoad);
                }
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
            for(const clientId in clients) { 
                playersCards[clientId] = {
                        turn: clients[clientId],
                        hand: [],
                        lookDown: [],
                        lookUp: []
                };
                for(let j = 0; j < 3; j++) {
                    let cardIndex = Math.floor(Math.random() * desk.desk.length);
                    playersCards[clientId].hand.push({
                        index: cardIndex,
                        card: desk.desk.splice(cardIndex, 1)[0]
                    });
                }
    
                for(let j = 0; j < 3; j++) {
                    let cardIndex = Math.floor(Math.random() * desk.desk.length);
                    playersCards[clientId].lookDown.push({
                        index: cardIndex,
                        card: desk.desk.splice(cardIndex, 1)[0]
                    });
                }
    
                for(let j = 0; j < 3; j++) {
                    let cardIndex = Math.floor(Math.random() * desk.desk.length);
                    playersCards[clientId].lookUp.push({
                        index: cardIndex,
                        card: desk.desk.splice(cardIndex, 1)[0]
                    });
                }
            }
            
            let gameState = {
                desk: desk.desk,
                pile: [],
                discarded: [],
                playersCards: playersCards
            };

            let pileIndex = Math.floor(Math.random() * gameState.desk.length);
            gameState.pile.push({ index: pileIndex, card: gameState.desk.splice(pileIndex, 1)[0]    });
            let topIndex = Math.floor(Math.random() * gameState.desk.length);
            gameState.top = { index: topIndex, card: gameState.desk.splice(topIndex, 1)[0] };
            

            game.state = gameState;
    
            for(const clientId in clients) {
                let allHandCards = game.state.playersCards;
                let clientCards = allHandCards[clientId];
                let opponentsCards = []
                for (const id in allHandCards) {
                    if(id != clientId) {
                        let hand = allHandCards[id].hand.map(card => {
                            return card.index;
                        });
                        let lookDown = allHandCards[id].lookDown.map(card => {
                            return card.index;
                        });
                        opponentsCards.push({
                            turn: allHandCards[id].turn,
                            opponentHandIndexes: hand,
                            opponentLookDownIndexes: lookDown,
                            opponentLookUp: allHandCards[id].lookUp
                        });
                    }
                }
                
                let clientState = {
                    clientCards: clientCards,
                    opponentsCards: opponentsCards,
                    pile: game.state.pile
                }
                let payload = {
                    gameId: game.gameId,
                    clientState: clientState
                }
                clientsHash[clientId].emit("startGame", payload);
            }
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
