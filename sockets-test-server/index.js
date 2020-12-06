const express = require('express');
const app = express();
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

const { createLobby, joinLobby, startGame, dropCard, finishTurn, pickUpPile } = require('./src/game');

app.use(morgan('common'));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile("index.html");
});


const server = app.listen(3000);
const io = require('socket.io').listen(server);

const clientsHash = {}

io.on('connection', (socket) => {
    console.log('[connection] New client:', socket.id);
    clientsHash[socket.id] = socket;
    
    socket.on('createLobby', async data => {
        let session = await createLobby(data);
        let clients = session.clients;
        let payload = {
            session: session
        }
        for(let id in clients) {
            clientsHash[id].emit('createLobby', payload);
        }
    });
    socket.on('joinLobby', async data => {
        let session = await joinLobby(data)
        let clients = session.clients;
        let payload = {
            session: session
        }
        for(let id in clients) {
            clientsHash[id].emit('createLobby', payload);
        }
    });
    socket.on('startGame', async data => {
        let clientsStates = await startGame(data);
        for(let id in clientsStates) {
            clientsHash[id].emit('startGame', { game: clientsStates[id] });
        }
    });
    socket.on('dropCard', async data => {
        await dropCard(data, emitFunctions);
    });
    socket.on('finishTurn', async data => { 
        let turnData = await finishTurn(data);
        let clients = turnData.clients;
        let payload = {
            actualTurn: turnData.actualTurn,
            turnsCount: turnData.turnsCount,
            skipTurns: turnData.skip
        }
        for(let id in clients) {
            clientsHash[clients[id]].emit('changeTurn', payload);
        }
    });
    socket.on('pickUpPile', async data => {
        let pickUpData = await pickUpPile(data);
        console.log(pickUpData);
        let clients = pickUpData.clients;
        let payload = {
            playerId: pickUpData.playerId,
            newCards: pickUpData.newCards,
            turn: pickUpData.turn
        };
        for(let id in clients) {
            clientsHash[clients[id]].emit('pickUpPile', payload);
        }
    });

    socket.on('disconnect', () => {
        console.log('[disconnect] Client: ' + socket.id + ' disconnected');
        delete clientsHash[socket.id];
    });
});

const emitFunctions = {
    dropCard: (clientsStates, clients) => {
        for(let id in clients) {
            let payload = {
                clientPlaying: clientsStates.clientPlaying,
                droppedCard: clientsStates.droppedCard,
                clientState: clientsStates.playersStates[clients[id]]
            }
            clientsHash[clients[id]].emit("dropCard", payload);
        }
    },
    pickUpCard: (clientsStates, clients) => {
        // TODO: Only the player who pick a card recives card data
        for(let id in clients) {
            clientsHash[clients[id]].emit("pickUpCard", clientsStates);
        }
    },
    resetEffects: (effects, clients) => {
        let payload = {
            effects: {
                transparent: effects.transparent,
                minor: effects.minor
            }
        };
        for(let id in clients) {
            clientsHash[clients[id]].emit("resetEffects", payload);
        }
    },
    discardPile: (clients) => {
        for(let id in clients) {
            clientsHash[clients[id]].emit("discardPile");
        }
    },
    jokerEffect: (gameState, clients) => {
        let payload = {
            playerId: gameState.playerId,
            newCards: gameState.newCards,
            turn: gameState.turn
        };
        for(let id in clients) {
            clientsHash[clients[id]].emit("pickUpPile", payload);
        }
    },
    applyEffectToDesk: (effectsState, clients) => {
        let payload = {
            direction: effectsState.direction,
            effects: effectsState.effects
        };
        for(let id in clients) {
            clientsHash[clients[id]].emit("applyEffects", payload);
        }
    }
}





