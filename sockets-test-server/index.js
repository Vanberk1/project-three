const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');

app.use(morgan('common'));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile("index.html");
});

const server = app.listen(3000);
const io = require('socket.io').listen(server);


const deskData = require('./src/deskData');

const clientsHash = {};
const sessionsHash = {};
const gamesHash = {};

io.on('connection', (socket) => {
    console.log('[connection] New client:', socket.id);
    clientsHash[socket.id] = socket;
    
    socket.on('createLobby', (data) => {
        // TODO: 
        //  - Create or active and user in db and create a session
        //  - Take gameId from db   
        let sessionId = newSessionId();
        let clientId = data.clientId;
        let clientName = data.clientName;
        let clients = {};
        clients[clientId] = { name: clientName };
        sessionsHash[sessionId] = {
            sessionId: sessionId,
            hostId: clientId,
            clients: clients
        };
        let payLoad = {
            session: sessionsHash[sessionId]
        };

        console.log("[createLobby] New session:", sessionId);
        console.log("[userCreated] New user:", clientName);
        let client = clientsHash[clientId];
        client.emit("createLobby", payLoad);
    });

    socket.on('joinLobby', (data) => {
        let sessionId = data.sessionId;
        let clientId = data.clientId;
        let clientName = data.clientName;
        if(sessionsHash.hasOwnProperty(sessionId)) {
            let session = sessionsHash[sessionId];
            if(clientsHash.hasOwnProperty(clientId)) {
                session.clients[clientId] = { name: clientName };
                console.log("[joinLobby] Client:", clientId, "joined to session:", sessionId);
                console.log("[userCreated] New user:", clientName);
                let payLoad = {
                    session: session
                };
                for(const id in session.clients) {
                    clientsHash[id].emit("joinLobby", payLoad);
                }
            }
        }
    });

    socket.on('startGame', (data) => {
        // TODO:
        //  -Get session from db
        //  -Create new game and player for users in session
        console.log(data);
        let sessionId = data.sessionId; 
        if(sessionsHash.hasOwnProperty(sessionId)) {
            let session = sessionsHash[sessionId];
            players = session.clients;
            let turn = 0;
            for(const id in players) {
                players[id].turn = ++turn;
            }

            // Create a new game id for this session
            let game = {
                gameId: newId(),
                sessionId: sessionId,
                state: makeServerState(players)
            }
            gamesHash[game.gameId] = game;

            session.actuaGame = game.gameId;
            session.games = [game.gameId];

            console.log("[startGame]: Game:", game.gameId, "started in session:", sessionId);
            for(const id in players) {
                let clientState = makeClientState(game.state, id);
                let payload = {
                    sessionId: game.sessionId,
                    gameId: game.gameId,
                    clients: players,
                    clientState: clientState
                }
                clientsHash[id].emit("startGame", payload);
            }
        }
    });

    socket.on('dropCard', (data) => {
        console.log("dropCard data", data);
        let clientPlaying = data.clientId;
        let gameId = data.gameId;
        let cardIndex = data.cardIndex;
        let game = gamesHash[gameId];
        let session = sessionsHash[game.sessionId];
        console.log(game);
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
            let clients = session.clients;
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

            if(playedCard.card.value == -1) {
                jokerEffect(gameState, clients);
            }
            else {
                applyEffectToDesk(playedCard, gameState, clients);
            }



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
        let session = sessionsHash[game.sessionId];
        console.log("finish turn");
        if(game) {
            let clientTurn = session.clients[clientId].turn;
            console.log("client turn:", clientTurn, " actual turn:", game.state.actualTurn);
            if(clientTurn && clientTurn === game.state.actualTurn) {
                let turn = game.state.actualTurn
                let numClients = Object.keys(session.clients).length; 
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

                let clients = session.clients;
                console.log(clients);
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
        let session = sessionsHash[game.sessionId];
        console.log(game);
        if(game) {
            let newCards = pickUpPile(game.state, clientId);

            let numClients = Object.keys(session.clients).length; 
            let turn = game.state.actualTurn;
            if(game.state.direction > 0) {
                turn = turn - 1 > 0 ? turn - 1 : numClients;
            }
            else {
                turn = turn + 1 <= numClients ? turn + 1 : 1;
            }
            game.state.actualTurn = turn;

            console.log("[pickUpPile] client: " + clientId + " actual turn: " + turn);

            for(const id in session.clients) {
                let payLoad = {
                    clientId: clientId,
                    newCards: newCards,
                    turn: turn
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

let pickUpPile = (gameState, clientId) => {
    let hand = gameState.clientsCards[clientId].hand;
    let newCards = [...gameState.pile].filter(card => card.card.value != -1);
    gameState.clientsCards[clientId].hand = hand.concat(newCards);
    gameState.pile = []
    return newCards;
}

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

    // let pileIndex = Math.floor(Math.random() * gameState.desk.length);
    // gameState.pile.push({ index: newId(), card: gameState.desk.splice(pileIndex, 1)[0] });
    // gameState.stackedPile = stackedPileCount(gameState.pile);
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
    if(effects.transparent) {
        for(let i = pile.length - 1; i >= 0; i--) {
            if(pile[i].card.value != 2) {
                pileValue = pile[i].card.value;
                break;
            }
        }
    }

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
    }

    let payLoad = {
        direction: gameState.direction,
        effects: gameState.effects
    };
    for(clientId in clients) {
        clientsHash[clientId].emit("applyEffects", payLoad);
    }
}

let jokerEffect = (gameState, clients) => {
    console.log("Joker");
    let actualTurn = gameState.actualTurn;
    let pickUpPlayerTurn = gameState.actualTurn;
    let numClients = Object.keys(clients).length; 
    if(gameState.direction > 0) {
        pickUpPlayerTurn = actualTurn + 1 <= numClients ? actualTurn + 1 : 1;
    }
    else {
        pickUpPlayerTurn = actualTurn - 1 > 0 ? actualTurn - 1 : numClients;
    }
    // console.log("turn:", turn);
    for(clientId in clients) {
        // console.log(clientId);
        // console.log(clients[clientId])
        if(clients[clientId].turn == pickUpPlayerTurn) {
            let newCards = pickUpPile(gameState, clientId);
            let turn = actualTurn;

            console.log("[pickUpPile] client: " + clientId + " actual turn: " + turn);

            for(const id in clients) {
                let payLoad = {
                    clientId: clientId,
                    newCards: newCards,
                    turn: turn
                };
                clientsHash[id].emit('pickUpPile', payLoad);
            }

            break;
        }
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
        clientsHash[clientId].emit("resetEffects", payLoad);
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

let newSessionId = () => {
    return 'xxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }).toUpperCase();
  }
