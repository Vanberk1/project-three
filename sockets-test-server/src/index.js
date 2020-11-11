const app = require('express')();
const server = app.listen(3000);
const io = require('socket.io').listen(server);

const deskData = require('./deskData');

const clientsHash = {};
const gamesHash = {};

io.on('connection', (socket) => {
    console.log('[connection] New client:', socket.id);
    clientsHash[socket.id] = socket;
    socket.emit('newClient', { clientId: socket.id });
    
    socket.on('createGame', (data) => {
        let gameId = newGameId();
        let clientId = data.clientId;
        let clientName = data.clientName;
        let clients = {};
        clients[clientId] = { turn: 1, name: clientName };
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
        let clientName = data.clientName;
        if(gamesHash.hasOwnProperty(gameId)) {
            let game = gamesHash[gameId];
            if(clientsHash.hasOwnProperty(clientId)) {
                let turn = Object.keys(game.clients).length + 1;
                game.clients[clientId] = { turn: turn, name: clientName };
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
        console.log("dropCard data", data);
        let clientPlaying = data.clientId;
        let gameId = data.gameId;
        let cardIndex = data.cardIndex;
        let game = gamesHash[gameId];
        let gameState = game.state;
        let clientPlayingCards = gameState.clientsCards[clientPlaying]
        let playedCard;
        // TODO: Add from what cards group was dropped
        clientPlayingCards.hand = clientPlayingCards.hand.filter(card => { 
            if(card.index !== cardIndex) {
                return true;
            }
            else {
                playedCard = card;
                return false;
            }
        });
        console.log("played card", playedCard);
        // console.log("Cards in hand:", clientPlayingCards.hand.length);
        if(checkCanDropCard(playedCard, gameState)) {
            console.log("[dropCard]", playedCard);
            let clients = game.clients;
            let pile = gameState.pile;
            resetEffects(gameState, clients);
            pile.push(playedCard);
            gameState.stackedPile = stackedPileCount(pile);
            // console.log("game pile:", game.state.pile);
            for(const clientId in clients) {
                let clientState = makeClientState(gameState, clientId);
                let payload = {
                    gameId: game.gameId,
                    clientPlaying: clientPlaying,
                    droppedCard: cardIndex,
                    clientState: clientState
                }
                clientsHash[clientId].emit("dropCard", payload);
            }
            if(gameState.stackedPile >= 4) {
                discardPile(gameState, clients);
            }
            applyEffectToDesk(playedCard, gameState, clients);

            // console.log(gameState);
            // console.log(clientPlayingCards.hand);

            if(clientPlayingCards.hand.length < 3 && game.state.desk.length > 0) {
                let topCard = JSON.parse(JSON.stringify(game.state.top));
                clientPlayingCards.hand.push(topCard);

                let newTopIndex = Math.floor(Math.random() * gameState.desk.length);
                gameState.top = { index: newId(), card: gameState.desk.splice(newTopIndex, 1)[0] }; 

                let payLoad = {
                    gameId: game.gameId,
                    clientId: clientPlaying,
                    pickUpCard: topCard,
                    deskCount: gameState.desk.length
                };

                console.log("[pickUpCard]", topCard);
                
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
            let clientTurn = game.clients[clientId].turn;
            // console.log("client turn:", clientTurn, " actual turn:", game.state.actualTurn);
            if(clientTurn && clientTurn === game.state.actualTurn) {
                let turn = game.state.actualTurn
                let numClients = Object.keys(game.clients).length; 
                let skipTurns = game.state.effects.skipTurns;
                let skip = skipTurns >= 1 ? true : false;
                if(game.state.direction > 0) {
                    for(let i = 0; i <= skipTurns; i++) {
                        turn = turn + 1 <= numClients ? turn + 1 : 1;
                    }
                }
                else {
                    for(let i = 0; i <= skipTurns; i++) {
                        turn = turn - 1 > 0 ? turn - 1 : numClients;
                    }
                }
                game.state.effects.skipTurns = 0;
                game.state.actualTurn = turn;
                game.state.turnsCount++;
                
                console.log("[finishTurn] Actual turn:", turn, "Turns count:", game.state.turnsCount);

                let payLoad = {
                    actualTurn: game.state.actualTurn,
                    turnsCount: game.state.turnsCount,
                    skipTurns: skip
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
                name: clients[clientId].name,
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
        clientsCards: clientsCards,
        pile: [],
        discarded: [],
        direction: 1,
        actualTurn: actualTurn,
        turnsCount: 0,
        stackedPile: 0,
        effects: {
            transparent: false,
            minor: false,
            skipTurns: 0
        }
    };

    let pileIndex = Math.floor(Math.random() * gameState.desk.length);
    gameState.pile.push({ index: newId(), card: gameState.desk.splice(pileIndex, 1)[0] });
    gameState.stackedPile = stackedPileCount(gameState.pile);
    let topIndex = Math.floor(Math.random() * gameState.desk.length);
    gameState.top = { index: newId(), card: gameState.desk.splice(topIndex, 1)[0] }; 

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
                name: allClientCards[id].name,
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
        discarded: gameState.discarded,
        direction: gameState.direction,
        actualTurn: gameState.actualTurn,
        turnsCount: gameState.turnsCount,
        deskCount: gameState.desk.length,
        stackedPile: gameState.stackedPile,
        effects: gameState.effects
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
    let diferentCard = false;
    for(let i = pileLookUp.length - 1; i >= 0; i--) {
        if(pileLookUp[i].card.value == actualValue && !diferentCard) {
            repeatedCount++;
            actualValue = pileLookUp[i].card.value;
        }
        else {
            diferentCard = true;
        }
    }

    return repeatedCount;
}

let checkCanDropCard = (playedCard, gameState) => {
    // console.log("played card", playedCard);
    let pile = gameState.pile;
    let effects = gameState.effects;
    let pileEmpty = pile.length ? false : true;
    let pileValue = !pileEmpty ? pile[pile.length - 1].card.value : null;
    let cardValue = playedCard.card.value;

    if(!pileEmpty) {
        if(![-1, 1, 2, 9].includes(cardValue)) {
            if((effects.minor && cardValue > pileValue) || (!effects.minor && cardValue < pileValue)) {
                return false;
            }
        }
    }
    return true;
}

let applyEffectToDesk = (playedCard, gameState, clients) => {
    let effects = gameState.effects;
    let cardValue = playedCard.card.value;

    switch(cardValue) {
        case 2:
            effects.transparent = true;
            break;
        case 6:
            effects.minor = true;
            break;
        case 7:
            effects.skipTurns++;
            break;
        case 9:
            discardPile(gameState, clients, playedCard);
            break;
        case 10:
            gameState.direction *= -1;
            break;
        case -1:
             //TODO: Joker effect
            break;
    }

    let payLoad = {
        direction: gameState.direction,
        effects: gameState.effects
    };
    for(clientId in clients) {
        clientsHash[clientId].emit("applyEffects", payLoad);
    }
}

let resetEffects = (gameState, clients) => {
    let effects = gameState.effects;

    effects.transparent = false;
    effects.minor = false;

    let payLoad = {
        effects: gameState.effects
    };
    for(clientId in clients) {
        clientsHash[clientId].emit("removeEffects", payLoad);
    }
};

let discardPile = (gameState, clients, card) => {
    gameState.discarded.push([...gameState.pile]);
    gameState.pile = [];
    gameState.stackedPile = 0;
    console.log("[discardPile]");
    for(clientId in clients) {
        let payLoad = {
            cardDropped: card
        };
        clientsHash[clientId].emit("discardPile", payLoad);
    }
}

let newId = () => {
  return 'xxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let newGameId = () => {
    return 'xxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }).toUpperCase();
  }
