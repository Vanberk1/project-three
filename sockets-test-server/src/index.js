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
        clients[clientId] = { turn: 1 };
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
                game.clients[clientId] = { turn: turn };
                console.log("[joinGame] Client:", clientId, "joined to game:", gameId);
                let payLoad = {
                    game: game
                };
                for(const id in game.clients) {
                    clientsHash[id].emit("joinGame", payLoad);
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
        if(game && client && game.clients.hasOwnProperty(clientPlaying)) {
            let gameState = game.state;
            let clientCards = gameState.clientsCards[clientPlaying]
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
            console.log("[dropCard] Client:", clientPlaying, "play", playedCard, "card in game:", gameId);

            let pile = game.state.pile;
            let pileEmpty = pile.length != 0 ? false : true;
            let pileValue;
            if(!pileEmpty) {
                pileValue = pile[pile.length - 1].card.value;
            }
            let cardValue = playedCard.card.value;

            // console.log("Cards in hand:", clientCards.hand.length);

            if(pileEmpty || cardValue >= pileValue || cardValue == 0 || cardValue == -1) {
                pile.push(playedCard);
                gameState.stackedPile = stackedPileCount(pile);
                // console.log("game pile:", game.state.pile);
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

                console.log(clientCards.hand);

                if(gameState.stackedPile >= 4 || cardValue == 9) {
                    gameState.discarded.push([...gameState.pile]);
                    gameState.pile = [];
                    gameState.stackedPile = 0;
                    for(clientId in clients) {
                        let payLoad = {

                        };
                        clientsHash[clientId].emit("discardPile", payLoad);
                    }

                    console.log("pile", gameState.pile);
                    console.log("discarted", gameState.discarded);
                }
    
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
    
                    console.log("[pickUpCard] Client:", clientPlaying, "pick up", topCard, "card in game:", gameId);
                    
                    for(const clientId in clients) {
                        clientsHash[clientId].emit("pickUpCard", payLoad);
                    }
                }
            }
        }
    });

    socket.on('finishTurn', (data) => {
        let gameId = data.gameId;
        let clientId = data.clientId;
        let game = gamesHash[gameId];
        if(game) {
            let clientTurn = game.clients[clientId].turn;
            // console.log("client turn:", clientTurn, " actual turn:", game.state.actualTurn);
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

    socket.on('pickUpPile', (data) => {
        let gameId = data.gameId;
        let clientId = data.clientId;
        let game = gamesHash[gameId];

        if(game) {
            let hand = game.state.clientsCards[clientId].hand;
            // console.log("hand:", hand);
            // console.log("pile:", game.state.pile);

            let newCards = [...game.state.pile];
            game.state.clientsCards[clientId].hand = hand.concat(newCards);
            game.state.pile = []
            // console.log("hand:", hand);
            // console.log("pile:", game.state.pile);
            // console.log("new hand:", game.state.clientsCards[clientId].hand);

            for(const id in game.clients) {
                let payLoad = {
                    clientId: clientId,
                    newCards: newCards
                };
                clientsHash[id].emit('pickUpPile', payLoad);
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
    let clientsCards = {};
    let turns = [];
    for(const clientId in clients) { 
        turns.push(clients[clientId].turn);
        clientsCards[clientId] = {
                turn: clients[clientId].turn,
                hand: [],
                lookDown: [],
                lookUp: []
        };
        for(let j = 0; j < 3; j++) {
            let cardIndex = Math.floor(Math.random() * desk.desk.length);
            clientsCards[clientId].hand.push({
                index: newId(),
                card: desk.desk.splice(cardIndex, 1)[0]
            });
        }

        for(let j = 0; j < 3; j++) {
            let cardIndex = Math.floor(Math.random() * desk.desk.length);
            clientsCards[clientId].lookDown.push({
                index: newId(),
                card: desk.desk.splice(cardIndex, 1)[0]
            });
        }

        for(let j = 0; j < 3; j++) {
            let cardIndex = Math.floor(Math.random() * desk.desk.length);
            clientsCards[clientId].lookUp.push({
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
        clientsCards: clientsCards,
        stackedPile: 0
    };

    let pileIndex = Math.floor(Math.random() * gameState.desk.length);
    gameState.pile.push({ index: newId(), card: gameState.desk.splice(pileIndex, 1)[0] });
    let topIndex = Math.floor(Math.random() * gameState.desk.length);
    gameState.top = { index: newId(), card: gameState.desk.splice(topIndex, 1)[0] }; 

    gameState.stackedPile = stackedPileCount(gameState.pile);

    return gameState;
}

let makeClientState = (gameState, clientId) => {
    let allClientCards = gameState.clientsCards;
    let clientCards = allClientCards[clientId];
    let opponentsCards = []
    for (const id in allClientCards) {
        if(id != clientId) {
            let hand = allClientCards[id].hand.map(card => {
                return card.index;
            });
            let lookDown = allClientCards[id].lookDown.map(card => {
                return card.index;
            });
            opponentsCards.push({
                turn: allClientCards[id].turn,
                opponentHandIndexes: hand,
                opponentLookDownIndexes: lookDown,
                opponentLookUp: allClientCards[id].lookUp
            });
        }
    }
    
    let clientState = {
        clientCards: clientCards,
        opponentsCards: opponentsCards,
        pile: gameState.pile,
        actualTurn: gameState.actualTurn,
        turnsCount: gameState.turnsCount,
        deskCount: gameState.desk.length,
        stackedPile: gameState.stackedPile
    };

    return clientState;
}

let stackedPileCount = (pile) => {
    // console.log("pile:", pile);
    let repeatedCount = 0;
    let pileLookUp = pile.slice(-4);
    // console.log("pile look up", pileLookUp);
    // console.log("pile", pile);
    let actualValue = pileLookUp[pileLookUp.length - 1].card.value;
    for(let i = pileLookUp.length - 1; i >= 0; i--) {
        if(pileLookUp[i].card.value == actualValue) {
            repeatedCount++;
            actualTurn = pileLookUp[i].card.value;
        }
    }

    return repeatedCount;
}

let newId = () => {
  return 'xxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
