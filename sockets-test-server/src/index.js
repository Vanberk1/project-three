const app = require('express')();
const server = app.listen(3000);
const io = require('socket.io').listen(server);

const { json } = require('express');
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
                    game: game
                };
                for(const clientId in game.clients) {
                    clientsHash[clientId].emit("joinGame", payLoad);
                }
            }
        }
    });

    socket.on('startGame', (data) => {
        let gameId = data.gameId;
        if(gamesHash.hasOwnProperty(gameId)) {
            let game = gamesHash[gameId];
            let clients = game.clients;

            let gameState = makeServerState(clients);
            
            game.state = gameState;
    
            for(const clientId in clients) {
                let clientState = makeClientState(game.state, clientId);

                let payload = {
                    gameId: game.gameId,
                    clientState: clientState
                }
                clientsHash[clientId].emit("startGame", payload);
            }
        }
    });

    socket.on('dropCard', (data) => {
        console.log(data);
        let clientPlaying = data.clientId;
        let gameId = data.gameId;
        let cardIndex = data.cardIndex;
        let game = gamesHash[gameId];
        let client = clientsHash[clientPlaying];
        if(game && client && game.clients.hasOwnProperty(clientPlaying)) {
            let gameState = game.state;
            let clientCards = gameState.playersCards[clientPlaying]
            let playedCard;
            // TODO: Add from what cards group was dropped
            clientCards.hand = clientCards.hand.filter(card => { 
                if(card.index !== cardIndex) {
                    return true;
                }
                else {
                    playedCard = card;
                    return false;
                }
            });

            console.log(game.state.playersCards);
            console.log(playedCard);

            game.state.pile.push(playedCard);

            let clients = game.clients;
            for(const clientId in clients) {
                let clientState = makeClientState(game.state, clientId);
                let payload = {
                    gameId: game.gameId,
                    clientPlaying: clientPlaying,
                    droppedCard: cardIndex,
                    clientState: clientState
                }
                clientsHash[clientId].emit("dropCard", payload);
            }

            if(clientCards.hand.length < 3 && game.state.desk.length > 0) {
                let topCard = JSON.parse(JSON.stringify(game.state.top));
                console.log("Before: ", game.state.top);
                
                let newTopIndex = Math.floor(Math.random() * gameState.desk.length);
                gameState.top = { index: guid(), card: gameState.desk.splice(newTopIndex, 1)[0] }; 
                
                console.log("After: ", game.state.top);

                let payLoad = {
                    gameId: game.gameId,
                    clientId: clientPlaying,
                    pickUpCard: topCard
                };
                
                for(const clientId in clients) {
                    clientsHash[clientId].emit("pickUpCard", payLoad);
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('user '+ socket.id +' disconnected');
        delete clientsHash[socket.id];
    });
});

let makeServerState = (clients) => {
    let desk = JSON.parse(JSON.stringify(deskData));
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
                index: guid(),
                card: desk.desk.splice(cardIndex, 1)[0]
            });
        }

        for(let j = 0; j < 3; j++) {
            let cardIndex = Math.floor(Math.random() * desk.desk.length);
            playersCards[clientId].lookDown.push({
                index: guid(),
                card: desk.desk.splice(cardIndex, 1)[0]
            });
        }

        for(let j = 0; j < 3; j++) {
            let cardIndex = Math.floor(Math.random() * desk.desk.length);
            playersCards[clientId].lookUp.push({
                index: guid(),
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
    gameState.pile.push({ index: guid(), card: gameState.desk.splice(pileIndex, 1)[0] });
    let topIndex = Math.floor(Math.random() * gameState.desk.length);
    gameState.top = { index: guid(), card: gameState.desk.splice(topIndex, 1)[0] }; 

    return gameState;
}

let makeClientState = (gameState, clientId) => {
    let allHandCards = gameState.playersCards;
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
        pile: gameState.pile
    }

    return clientState
}

let guid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
