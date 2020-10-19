import io from 'socket.io-client';
import InputText from 'phaser3-rex-plugins/plugins/inputtext.js';

import Card from './Card';
import Player from './Player';
import Opponent from './Opponent';

const types = {
    0: 'club',
    1: 'diamond',
    2: 'heart',
    3: 'spade',
    4: 'joker'
};

export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: "Game"
        });
    }
    
    socketConnections() {
        this.socket = io.connect('http://localhost:3000');

        this.socket.on('connect', () => {
            console.log("Connected");
        });

        this.socket.on('newClient', (data) => {
            this.clientId = data.clientId;
            console.log(this.clientId);
        });

        this.socket.on('createGame', (data) => {
            console.log("[createGame]", data.game);
            this.game = data.game;
            this.drawLobby();
        });

        this.socket.on('joinGame', (data) => {
            this.game = data.game;
            console.log("[joinGame] this.game:", this.game);
            if(this.dealText) {
                this.dealText.destroy();
            }
            if(this.playersNames) {
                this.playersNames.forEach(name => {
                    name.destroy();
                });
            }
            this.drawLobby();
        });

        this.socket.on('startGame', (data) => {
            console.log("[startGame] client state:", data.clientState);
            if(this.clientId == this.game.hostId) {
                this.dealText.destroy();
            }
            this.playersNames.forEach(name => {
                name.destroy();
            });
            this.createGame(data.clientState);
        });

        this.socket.on('dropCard', (data) => {
            console.log("[dropCard]", data);
            let pile = data.clientState.pile;
            let cardDropped = pile[pile.length - 1];
            let clientId = data.clientPlaying;
            this.player.cardPlayed = true;
            this.game.state.pile.pileData = pile;
            if(data.clientState.stackedPile > 1) {
                let pileCountText = "x" + data.clientState.stackedPile;
                this.pileCount.text = pileCountText;
                this.pileCount.visible = true;
            }
            else {
                this.pileCount.visible = false;
            }
            this.dropCard(clientId, data.droppedCard, cardDropped)
        });

        this.socket.on('pickUpCard', (data) => {
            console.log("[pickUpCard]", data);
            this.addCardToHand(data.clientId, data.pickUpCard);
            let deskCountText = "x" + data.deskCount;
            this.deskCount.text = deskCountText;
            if(data.deskCount === 0) {
                this.deskCard.visible = false;
            }
        }); 

        this.socket.on('changeTurn', (data) => {
            this.actualTurn = data.actualTurn;
            this.turnsCount = data.turnsCount;  
            console.log("[changeTurn]", data);
            if(this.player.turn == data.actualTurn) {
                this.player.inTurn = true;
                this.player.cardPlayed = false;
                console.log(!this.checkPickUpPile());
                if(!this.checkPickUpPile()) {
                    let payLoad = {
                        gameId: this.game.gameId,
                        clientId: this.clientId
                    };
                    this.socket.emit('pickUpPile', payLoad);
                }
                this.player.enableHandInteractions();
                this.finishButton.setInteractive();
                this.finishButton.visible = true;
            }
        });

        this.socket.on('pickUpPile', (data) => {
            console.log("[pickUpCard]", data);
            let clientId = data.clientId;
            let newCards = data.newCards;
            this.pickUpPile(clientId, newCards);
        });
    }

    preload() {
        this.load.spritesheet("heart", "src/assets/heart-sheet.png", { frameWidth: 35, frameHeight: 47 });
        this.load.spritesheet("club", "src/assets/club-sheet.png", { frameWidth: 35, frameHeight: 47 });
        this.load.spritesheet("diamond", "src/assets/diamond-sheet.png", { frameWidth: 35, frameHeight: 47 });
        this.load.spritesheet("spade", "src/assets/spade-sheet.png", { frameWidth: 35, frameHeight: 47 });
        this.load.image("blue-card-back", "src/assets/blue-card-back.png");
        this.load.image("red-card-back", "src/assets/red-card-back.png");
        this.load.image("blue-joker", "src/assets/blue-joker.png");
        this.load.image("red-joker", "src/assets/red-joker.png");

        this.canvas = this.sys.game.canvas;
    }

    create() {
        // Client state
        this.player = null;
        this.game = null;
        this.opponents = [];
        
        //Socket connections
        this.socketConnections();

        // UI elements
        this.createGameButton = this.add.text(100, 100, ['Crear partida']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.createGameButton.on('pointerdown', () => {
            let payLoad = {
                clientId: this.clientId
            }
            console.log(payLoad);
            this.socket.emit('createGame', payLoad);
        });

        this.joinGameButton = this.add.text(300, 100, ['Unirse a una partida']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        let inputConfig = {
            align: "left",
            placeholder: "Código de la partida",
            backgraundColor: "red",
            border: 1,
            borderColor: 'yellow',
        };
        this.inputText = new InputText(this, 350, 50, 300, 20, inputConfig);
        this.add.existing(this.inputText);

        this.joinGameButton.on('pointerdown', () => {
            if(this.inputText.text != "") {
                console.log("text: ", this.inputText.text);
                let gameId = this.inputText.text;

                let payLoad = {
                    clientId: this.clientId,
                    gameId: gameId
                }
                this.socket.emit('joinGame', payLoad);
            }
        });

        // Cards interactions
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });
        
        this.input.on('dragstart', (pointer, gameObject) => {
            gameObject.setTint(0xff69b4);
            this.children.bringToTop(gameObject);
        });
        
        this.input.on('dragend', (pointer, gameObject, dropped) => {
            gameObject.setTint();
            let cardIndex = gameObject.getData("index");
            let card = this.player.hand[cardIndex];
            // TODO: Add from what cards group was dropped
            if(card) {
                if(!this.checkValidCard(cardIndex) || !dropped) {
                    gameObject.x = gameObject.input.dragStartX;
                    gameObject.y = gameObject.input.dragStartY;
                }
            }
        });
        
        this.pileDropZone = this.add.zone(this.canvas.width / 2, this.canvas.height / 2, 100, 130).setRectangleDropZone(100, 130);
        this.input.on('drop', (pointer, gameObject, dropZone) => {
            let cardIndex = gameObject.getData("index");
            // TODO: Add from what cards group was dropped
            if(this.player.inTurn) {
                if(this.checkValidCard(cardIndex)) {
                    // console.log("Card index(drop):", cardIndex);
                    let card = this.player.hand[cardIndex];
                    let newCardData = {
                        index: cardIndex,
                        card: {
                            type: card.type,
                            value: card.value
                        }
                    };
                    this.addCardToPile(newCardData);
                    this.player.dropCardFromHand(cardIndex);
                    let payLoad = {
                        gameId: this.game.gameId,
                        clientId: this.clientId,
                        cardIndex: cardIndex
                        // TODO: Add from what cards group was dropped
                    };
                    this.socket.emit('dropCard', payLoad);
                }
            }
        });
    }

    update() {
    }

    createGame(gameState) {
        // Create player state
        let playerTurn = gameState.clientCards.turn;
        // console.log(playerTurn)
        let playerCardsData = gameState.clientCards;
        let playerCards = {
            hand: {},
            lookUp: {},
            lookDown: {}
        };

        playerCardsData.hand.forEach(cardData => {
            let card = new Card(cardData.index, true, { type: cardData.card.type, value: cardData.card.value });
            playerCards.hand[cardData.index] = card;
        });

        playerCardsData.lookUp.forEach(cardData => {
            let card = new Card(cardData.index, true, { type: cardData.card.type, value: cardData.card.value });
            playerCards.lookUp[cardData.index] = card;
        });

        playerCardsData.lookDown.forEach(cardData => {
            let card = new Card(cardData.index, false);
            playerCards.lookDown[cardData.index] = card;
        });

        this.player = new Player(playerTurn, playerCards);
        if(playerTurn == gameState.actualTurn) {
            this.player.inTurn = true;
        }

        // Create opponents states
        let opponentsCards = gameState.opponentsCards;
        opponentsCards.forEach(opponent => {
            let turn = opponent.turn;
            let opponentCards = {
                hand: {},
                lookUp: {},
                lookDown: {}
            };

            opponent.opponentHandIndexes.forEach(index => {
                opponentCards.hand[index] = new Card(index, false);
            });

            opponent.opponentLookDownIndexes.forEach(index => {
                opponentCards.lookDown[index] = new Card(index, false);
            });

            opponent.opponentLookUp.forEach(cardData => {
                opponentCards.lookUp[cardData.index] = new Card(cardData.index, true, { type: cardData.card.type, value: cardData.card.value });;
            });

            this.opponents.push(new Opponent(turn, opponentCards));
        });

        this.opponents = this.sortOpponents(this.player.turn, this.opponents);

        // console.log(gameState);

        this.game.state = {
            pile: {
                pileData: [],
                // topCard: Card
            },
            discarded: [],
            actualTurn: gameState.actualTurn,
            turnsCount: gameState.turnsCount
        };

        let cardData = gameState.pile[gameState.pile.length - 1];  
        this.addCardToPile(cardData);
        
        // console.log(this.player);
        // console.log(this.opponents);
        // console.log(this.game.state);

        this.renderBoard(gameState.deskCount);
    } 

    sortOpponents(playerTurn, opponents) {
        let temp = [...opponents];    
        temp.sort((a, b) => { return a.turn - b.turn });
        let sortedOpponents = [];

        if(playerTurn == 1 || playerTurn == opponents.length + 1) {
            sortedOpponents = temp;
        }
        else {
            let minors = [];
            temp.forEach(opponent => {
                if(playerTurn > opponent.turn) {
                    minors.push(opponent);
                }
                else {
                    sortedOpponents.push(opponent);
                }
            });

            if(minors.length) {
                sortedOpponents = sortedOpponents.concat(minors);
            }
        }
        return sortedOpponents;
    }

    dropCard(clientId, droppedCardIndex, cardData) {
        console.log(cardData);
        let playerTurn = this.game.clients[clientId].turn;
        if(playerTurn !== this.player.turn) {
            this.opponents.forEach(opponent => {
                if(opponent.turn == playerTurn) {
                    // TODO: Add from what cards group was dropped
                    opponent.dropCard(droppedCardIndex, "hand");
                    opponent.repositionHand(this.canvas.width, this.canvas.height);
                    this.addCardToPile(cardData);
                }
            });
        }
    } 

    addCardToPile(cardData) {
        // console.log(cardData);
        let newCardData = {
            index: cardData.index,
            card: {
                type: cardData.card.type,
                value: cardData.card.value
            }
        };

        this.game.state.pile.pileData.push(newCardData);

        let newCard = new Card(cardData.index, true, { type: cardData.card.type, value: cardData.card.value });
        if(newCard.value != -1) {
            let texture = types[newCard.type];
            newCard.makeCardObject(this, this.canvas.width / 2, this.canvas.height / 2, texture, false, newCard.value);
        }
        else {
            newCard.makeCardObject(this, this.canvas.width / 2, this.canvas.height / 2, "blue-joker", false);
        }

        if(this.game.state.pile.topCard) { 
            this.game.state.pile.topCard.cardObject.destroy();
        }
        this.game.state.pile.topCard = newCard;
    }

    addCardToHand(playerId, cardData) {
        let playerTurn = this.player.turn;
        let playingTurn = this.game.clients[playerId].turn; 
        if(playingTurn === playerTurn) {
            this.player.addCardToHand(this, cardData);
        }
        else {
            this.opponents.forEach(opponent => {
                if(playingTurn === opponent.turn) {
                    opponent.addCardToHand(this, cardData);
                }
            });
        }
    }

    pickUpPile(clientId, newCards) {
        console.log("pickUpPile");
        this.game.state.pile.topCard.cardObject.destroy();
        this.game.state.pile.topCard = null;
        this.game.state.pile.pileData = [];
        newCards.forEach(cardData => {
            this.addCardToHand(clientId, cardData);
        });
    }

    checkValidCard(cardIndex) {
        let pile = this.game.state.pile;
        if(pile.pileData.length < 1) {
            return true;
        }
        let pileValue = pile.pileData[pile.pileData.length - 1].card.value;
        let cardValue = this.player.hand[cardIndex].value;
        let cardPlayed = this.player.cardPlayed;
        // console.log("pileValue:", pileValue);
        // console.log("cardValue:", cardValue);
        // console.log("cardPlayed:", cardPlayed);
        if(!cardPlayed) {
            if(cardValue >= pileValue || cardValue == 0 || cardValue == -1) {
                return true;
            }
        }
        else {
            if(cardValue == pileValue) {
                return true;
            }
        }

        return false;
    }

    checkPickUpPile() {
        let pile = this.game.state.pile;
        let pileValue = pile.pileData[pile.pileData.length - 1].card.value;
        let hand = this.player.hand;

        let haveValidCard = false;
        for(const cardIndex in hand) {
            let value = hand[cardIndex].value;
            if(value >= pileValue || value == 0 || value == -1) {
                haveValidCard = true;
            }
        }
        return haveValidCard;
    }
    
    drawLobby() {
        if(this.createGameButton) this.createGameButton.destroy();
        if(this.joinGameButton) this.joinGameButton.destroy()
        if(this.inputText) this.inputText.destroy();

        // console.log("Client id: " + this.clientId);
        // console.log("Host id: " + this.game.hostId);

        if(this.clientId == this.game.hostId) {
            this.dealText = this.add.text(50, 50, ['Repartir']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
            this.dealText.on('pointerdown', () => {
                let payLoad = {
                    gameId: this.game.gameId 
                }
                this.socket.emit('startGame', payLoad);
            });
        }

        this.playersNames = [];
        let players = this.game.clients;
        let i = 0;
        for(const id in players) {
            let playerName = "Player " + id + " Turn: " + players[id].turn;
            this.playersNames.push(this.add.text(200, 50 + (i * 25), [playerName]).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff'));
            i++
        }
    }

    makePlayerCardsObjects() {
        this.player.makeCardsObjects(this, types);
    }

    makeOpponentsCardsObjects() {
        let opponents = this.opponents;

        if(opponents.length == 1) {
            opponents[0].makeCardsObjects(this, types, "top");
        }
        else if(opponents.length == 2) {
            opponents[0].makeCardsObjects(this, types, "right");
            opponents[1].makeCardsObjects(this, types, "left");
        }
        else if(opponents.length == 3) {
            opponents[0].makeCardsObjects(this, types, "right");
            opponents[1].makeCardsObjects(this, types, "top");
            opponents[2].makeCardsObjects(this, types, "left");
        }
    }

    renderBoard(deskCount) {
        this.makePlayerCardsObjects();
        this.makeOpponentsCardsObjects();
        
        this.deskCard = this.add.image(this.canvas.width / 2 + 100,  this.canvas.height / 2, "red-card-back").setScale(2.0);
        let deskCountText = "x" + deskCount;
        this.deskCount = this.add.text(this.canvas.width / 2 + 150, this.canvas.height / 2 + 33, [deskCountText]).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff');
        
        this.pileCount = this.add.text(this.canvas.width / 2 + 45, this.canvas.height / 2 + 33, "").setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff');
        this.pileCount.visible = false;

        this.finishButton = this.add.text(1000, 600, ["Terminar turno"]).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff');
        this.finishButton.visible = false;
        this.finishButton.on('pointerdown', () => {
            this.player.disableHandInteractions();
            this.finishButton.disableInteractive();
            this.finishButton.visible = false;
            
            this.player.inTurn = false
            let payLoad = {
                gameId: this.game.gameId,
                clientId: this.clientId
            };
            this.socket.emit('finishTurn', payLoad);
        });

        if(this.player.inTurn) {
            this.finishButton.visible = true;
            this.finishButton.setInteractive();
        }
    }
}