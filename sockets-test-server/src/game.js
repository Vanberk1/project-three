const { createNewSession, joinSession, createPlayer, createGame, playersInGameCount, getDirection, setActualTurn } = require('./db.connection');
const { getUsersInSession, getFullDesk, getPile, getCard, getEffects, getConnectionsFromGame, getActualTurn, getGameState, getPlayerTurn } = require('./db.connection');
const { applyEffects, dropCardInPile, resetGameEffects, pickUpCard, changeTurn, playerPickUpPile, stackedPileCount, discardPile } = require('./db.connection');

const createLobby = async (data) => {
    let clientId = data.clientId;
    let clientName = data.clientName;
    let sessionId = await createNewSession(clientId, clientName);

    let clients = {};
    clients[clientId] = { name: clientName };

    let session = {
        sessionId: sessionId,
        hostId: clientId,
        clients: clients
    }

    console.log("[createLobby] New session:", sessionId);
    console.log("[userCreated] New user:", clientName);

    return session;
}

const joinLobby = async (data) => {
    let clientId = data.clientId;
    let username = data.clientName;
    let sessionId = data.sessionId;
    let usersInSession = await joinSession(clientId, username, sessionId);

    // console.log(usersInSession);

    let clients = {};
    let host = false;
    let hostId;
    usersInSession.forEach(client => {
        clients[client.socket_id] = { name: client.username };
        if(!host && client.is_host) {
            hostId = client.socket_id;
            host = true;
        }
    });

    let session = {
        sessionId: sessionId,
        hostId: hostId,
        clients: clients
    }

    return session;
}

const startGame = async (data) => {
    let sessionId = data.sessionId;
    let usersInSession = await getUsersInSession(sessionId);
    // console.log(usersInSession);
    let turn = 0;
    let players = usersInSession.map(player => {
        return {
            clientId: player.socket_id,
            userId: player.user_id,
            username: player.username,
            turn: ++turn
        }
    });

    let gameState = await makeServerState(sessionId, players);

    let playersStates = {};
    players.forEach(player => {
        playersStates[player.clientId] = makeClientState(gameState, player.clientId);
    });

    console.log("[startGame]: Game:", gameState.gameId, "started.");

    return playersStates;
    
}

const dropCard = async (data, emitFunctions) => {
    let playerId = data.playerId;
    let gameId = data.gameId;
    let cardIndex = data.cardIndex;
    let pile = await getPile(gameId);
    let effects = await getEffects(gameId);
    let connections = await getConnectionsFromGame(gameId);
    console.log(connections);
    // TODO: Add from what cards group was dropped
    let groupName = "hand";
    let playedCard = await getCard(cardIndex);
    console.log("playedCard", playedCard);
    if(checkCanDropCard(playedCard, pile, effects)) {
        console.log("[dropCard]", playedCard);
        let card = await dropCardInPile(cardIndex, playerId, gameId, groupName);
        let effects = await resetGameEffects(gameId);
        console.log(effects);
        emitFunctions.resetEffects(effects, connections);
        let gameState = await getGameState(gameId);
        // console.log(gameState);
        let playersStates = {};
        let clients = gameState.clientsPlayerIds;
        for(let id in clients) {
            playersStates[id] = makeClientState(gameState, id);
        }

        let clientStates = {
            gameId: gameId,
            clientPlaying: playerId,
            droppedCard: cardIndex,
            playersStates: playersStates
        };
        
        emitFunctions.dropCard(clientStates, connections);

        let stackedPile = await stackedPileCount(gameId);
        if(stackedPile >= 4) {
            await discardPile(gameId);
            emitFunctions.discardPile(connections);
        }
        console.log(card);

        if(card.card_value == -1) {
            // TODO: Fix Joker effect
            // let jokerState = await jokerEffect(gameId, playerId);
            // emitFunctions.jokerEffect(jokerState, connections);
        }
        else {
            let effectsState = await applyEffectToDesk(card, gameId, emitFunctions);
            if(effectsState) {
                emitFunctions.applyEffectToDesk(effectsState, connections);
            }
        }

        let playerHand = []
        for(const id in clients) {
            if(clients[id] == playerId) {
                playerHand = clientStates.playersStates[id].playerState.hand;
                break;
            }
        }
        
        if(playerHand.length < 3 && gameState.desk.length > 0) {
            console.log("pick up card");
            let topCard = await pickUpCard(gameId, playerId);
            console.log(topCard);
            
            let pickedCardState = {
                playerId: playerId,
                pickUpCard: topCard,
                deskCount: gameState.desk.length
            };
            console.log(pickedCardState);
            emitFunctions.pickUpCard(pickedCardState, connections);
        }
    }
}

const finishTurn = async (data) => {
    let gameId = data.gameId;
    let playerId = data.playerId;
    let connections = await getConnectionsFromGame(gameId);
    let turnData = await changeTurn(gameId, playerId);
    
    console.log("[finishTurn] Actual turn:", turnData.actualTurn, "Turns count:", turnData.turnsCount);

    let turnState = {
        clients: connections,
        actualTurn: turnData.actualTurn,
        turnsCount: turnData.turnsCount,
        skipTurns: turnData.skipTurns
    };

    return turnState;
}

const pickUpPile = async (data) => {
    let gameId = data.gameId;
    let playerId = data.playerId;
    let connections = await getConnectionsFromGame(gameId);
    let newCards = await playerPickUpPile(gameId, playerId);
    let actualTurn = await getActualTurn(gameId); 

    console.log("[pickUpPile] client: " + playerId + " actual turn: " + actualTurn);

    let pickUpState = {
        clients: connections,
        playerId: playerId,
        newCards: newCards,
        turn: actualTurn
    };

    return pickUpState;
}

let applyEffectToDesk = async (playedCard, gameId, emitFunctions) => {
    let cardValue = playedCard.card_value;
    let effectsState = null;
    switch(cardValue) {
        case 2:
            effectsState = await applyEffects(gameId, { transparent: true })
            break;
        case 6:
            effectsState = await applyEffects(gameId, { minor: true })
            break;
        case 7:
            effectsState = await applyEffects(gameId, { skipTurns: true })
            break;
        case 9:
            let connections = await getConnectionsFromGame(gameId);
            await discardPile(gameId);
            emitFunctions.discardPile(connections);
            break;
        case 10:
            effectsState = await applyEffects(gameId, { direction: true })
            break;
    }
    return effectsState;
}

let jokerEffect = async (gameId, playerId) => {
    console.log("Joker");
    let direction = await getDirection(gameId);
    let actualTurn = await getActualTurn(gameId);
    let pickUpPlayerTurn = actualTurn;
    let numClients = await playersInGameCount(gameId); 
    if(direction > 0) {
        pickUpPlayerTurn = actualTurn + 1 <= numClients ? actualTurn + 1 : 1;
    }
    else {
        pickUpPlayerTurn = actualTurn - 1 > 0 ? actualTurn - 1 : numClients;
    }

    let newCards = await playerPickUpPile(gameId, playerId);
    let newTurn = await setActualTurn(gameId);

    let pickUpState = {
        playerId: playerId,
        newCards: newCards,
        turn: newTurn
    };

    return pickUpState;
}


let makeServerState = async (sessionId, players) => {
    let desk = await getFullDesk();

    let playersStates = {};
    let clientsPlayerIds = {};
    let turns = [];

    for(const i in players) {
        //create player in data base
        turns.push(players[i].turn);
        let playerId = await createPlayer(players[i].userId, players[i].turn);
        playersStates[playerId] = {
            userId: players[i].userId,
            clientId: players[i].clientId,
            name: players[i].username,
            turn: players[i].turn,
            hand: [],
            lookDown: [],
            lookUp: []
        };
        clientsPlayerIds[players[i].clientId] = playerId;
        for(let j = 0; j < 3; j++) {
            let cardIndex = Math.floor(Math.random() * desk.length);
            playersStates[playerId].hand.push(desk.splice(cardIndex, 1)[0]);
        }

        for(let j = 0; j < 3; j++) {
            let cardIndex = Math.floor(Math.random() * desk.length);
            playersStates[playerId].lookDown.push(desk.splice(cardIndex, 1)[0]);
        }

        for(let j = 0; j < 3; j++) {
            let cardIndex = Math.floor(Math.random() * desk.length);
            playersStates[playerId].lookUp.push(desk.splice(cardIndex, 1)[0]);
        }
    }
    
    let actualTurn = turns[Math.floor(Math.random() * turns.length)];
    
    let gameCreationData = {
        desk: desk,
        playersStates: playersStates,
        actualTurn: actualTurn
    }

    let topIndex = Math.floor(Math.random() * gameCreationData.desk.length);
    gameCreationData.top = gameCreationData.desk.splice(topIndex, 1)[0]; 

    let gameId = await createGame(sessionId, gameCreationData);

    let gameState = {
        gameId: gameId,
        desk: desk,
        playersStates: playersStates,
        clientsPlayerIds: clientsPlayerIds,
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

    return gameState;
}

let makeClientState = (gameState, clientId) => {
    let allPlayersStates = gameState.playersStates;
    let clientsPlayerIds = gameState.clientsPlayerIds;
    let playerId = clientsPlayerIds[clientId]
    let playerState = allPlayersStates[playerId];
    playerState.playerId = playerId;
    let opponentsCards = []
    for (const id in allPlayersStates) {
        if(allPlayersStates[id].clientId != clientId) {
            let hand = allPlayersStates[id].hand.map(card => {
                return card.index;
            });
            let lookDown = allPlayersStates[id].lookDown.map(card => {
                return card.index;
            });
            let lookUp = allPlayersStates[id].lookUp;
            opponentsCards.push({
                playerId: id,
                name: allPlayersStates[id].name,
                turn: allPlayersStates[id].turn,
                opponentHandIndexes: hand,
                opponentLookDownIndexes: lookDown,
                opponentLookUp: lookUp
            });
        }
    }
    
    let clientState = {
        gameId: gameState.gameId,
        playerState: playerState,
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

    // console.log(clientState);

    return clientState;
}

let checkCanDropCard = (playedCard, pile, effects) => {
    // console.log("played card", playedCard);
    // console.log(pile);
    let pileEmpty = pile.length ? false : true;
    let pileValue = !pileEmpty ? pile[pile.length - 1].value : null;
    let cardValue = playedCard.value;
    if(effects.transparent) {
        for(let i = pile.length - 1; i >= 0; i--) {
            if(pile[i].value != 2) {
                pileValue = pile[i].value;
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

module.exports = {
    createLobby,
    joinLobby,
    startGame,
    dropCard,
    finishTurn,
    pickUpPile
}