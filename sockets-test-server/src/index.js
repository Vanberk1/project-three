const app = require('express')();
const server = app.listen(3000);
const io = require('socket.io').listen(server);

const { json } = require('express');
const deskData = require('./deskData');

const clientsHash = {};
const gamesHash = {};

io.on('connection', (socket) => {
    console.log('[connection] New client:', socket.id);
    clientsHash[socket.id] = socket;
    socket.emit('newClient', { clientId: socket.id });
    
    socket.on('createGame', (data) => {
        let gameId = newId();
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

        console.log("[createGame] New game:", gameId);
        let client = clientsHash[clientId];
        client.emit("createGame", payLoad);
    });

    socket.on('joinGame', (data) => {
        let gameId = data.gameId;
        let clientId = data.clientId;
        if(gamesHash.hasOwnProperty(gameId)) {
            let game = gamesHash[gameId];
            if(clientsHash.hasOwnProperty(clientId)) {
                let turn = Object.keys(game.clients).length + 1;
                game.clients[clientId] = turn;
                console.log("[joinGame] Client:", clientId, "joined to game:", gameId);
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
            

            console.log("[startGame]: Game:", gameId, "started");
            for(const clientId in clients) {
                let clientState = makeClientState(game.state, clientId);

                let payload = {
                    gameId: game.gameId,
                    clientState: clientState,
                }
                clientsHash[clientId].emit("startGame", payload);
            }
        }
    });

    socket.on('dropCard', (data) => {
        let clientPlaying = data.clientId;
        let gameId = data.gameId;
        let cardIndex = data.cardIndex;
        let game = gamesHash[gameId];
        let client = clientsHash[clientPlaying];
        console.log("[dropCard] Client:", clientPlaying, "play", cardIndex, "card in game:", gameId);
        if(game && client && game.clients.hasOwnProperty(clientPlaying)) {
            let gameState = game.state;
            let clientCards = gameState.playersCards[clientPlaying]
            let playedCard;
            // TODO: Add from what cards group was dropped
            console.log("Card played:", cardIndex);
            clientCards.hand = clientCards.hand.filter(card => { 
                console.log("card:", card.index);
                if(card.index !== cardIndex) {
                    return true;
                }
                else {
                    playedCard = card;
                    return false;
                }
            });

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

            console.log(clientCards.hand.length);
            if(clientCards.hand.length < 3 && game.state.desk.length > 0) {
                let topCard = JSON.parse(JSON.stringify(game.state.top));
                clientCards.hand.push(topCard);

                let newTopIndex = Math.floor(Math.random() * gameState.desk.length);
                gameState.top = { index: newId(), card: gameState.desk.splice(newTopIndex, 1)[0] }; 

                let payLoad = {
                    gameId: game.gameId,
                    clientId: clientPlaying,
                    pickUpCard: topCard,
                    deskCount: gameState.desk.length
                };

                console.log("[pickUpCard] Client:", clientPlaying, "pick up", topCard.index, "card in game:", gameId);
                
                for(const clientId in clients) {
                    clientsHash[clientId].emit("pickUpCard", payLoad);
                }
            }

        }
    });

    socket.on('finishTurn', (data) => {
        let gameId = data.gameId;
        let clientId = data.clientId;
        let game = gamesHash[gameId];
        if(game) {
            let clientTurn = game.clients[clientId];
            if(clientTurn && clientTurn === game.state.actualTurn) {
                let turn = game.state.actualTurn
                let numClients = Object.keys(game.clients).length; 
                turn = turn + 1 <= numClients ? turn + 1 : 1;
                game.state.actualTurn = turn;
                game.state.turnsCount++;
                
                console.log("[finishTurn] Actual turn:", turn, "Turns count:", game.state.turnsCount);

                let payLoad = {
                    actualTurn: game.state.actualTurn,
                    turnsCount: game.state.turnsCount
                };

                let clients = game.clients;
                for(const clientId in clients) {
                    clientsHash[clientId].emit("changeTurn", payLoad);
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('[disconnect] Client: '+ socket.id +' disconnected');
        delete clientsHash[socket.id];
    });
});

let makeServerState = (clients) => {
    let desk = JSON.parse(JSON.stringify(deskData));
    let playersCards = {};
    let turns = [];
    for(const clientId in clients) { 
        turns.push(clients[clientId]);
        playersCards[clientId] = {
                turn: clients[clientId],
                hand: [],
                lookDown: [],
                lookUp: []
        };
        for(let j = 0; j < 3; j++) {
            let cardIndex = Math.floor(Math.random() * desk.desk.length);
            playersCards[clientId].hand.push({
                index: newId(),
                card: desk.desk.splice(cardIndex, 1)[0]
            });
        }

        for(let j = 0; j < 3; j++) {
            let cardIndex = Math.floor(Math.random() * desk.desk.length);
            playersCards[clientId].lookDown.push({
                index: newId(),
                card: desk.desk.splice(cardIndex, 1)[0]
            });
        }

        for(let j = 0; j < 3; j++) {
            let cardIndex = Math.floor(Math.random() * desk.desk.length);
            playersCards[clientId].lookUp.push({
                index: newId(),
                card: desk.desk.splice(cardIndex, 1)[0]
            });
        }
    }

    let actualTurn = turns[Math.floor(Math.random() * turns.length)];
    
    let gameState = {
        desk: desk.desk,
        pile: [],
        discarded: [],
        actualTurn: actualTurn,
        turnsCount: 0,
        playersCards: playersCards
    };

    let pileIndex = Math.floor(Math.random() * gameState.desk.length);
    gameState.pile.push({ index: newId(), card: gameState.desk.splice(pileIndex, 1)[0] });
    let topIndex = Math.floor(Math.random() * gameState.desk.length);
    gameState.top = { index: newId(), card: gameState.desk.splice(topIndex, 1)[0] }; 

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
        pile: gameState.pile,
        actualTurn: gameState.actualTurn,
        turnsCount: gameState.turnsCount,
        deskCount: gameState.desk.length
    }

    return clientState
}

let newId = () => {
  return 'xxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
