import io from 'socket.io-client';
import InputText from 'phaser3-rex-plugins/plugins/inputtext.js';

import Card from './Card';
import Player from './Player';
import Opponent from './Opponent';

export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: "Game"
        });
        
        // Client state
        this.player = null;
        this.game = null;
        this.opponents = [];
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
            let effects = data.clientState.effects;
            let clientId = data.clientPlaying;
            this.game.state.pile.pileData = pile;
            this.game.state.effects = effects;
            this.game.state.stackedPile = data.clientState.stackedPile;
            this.game.state.direction = data.clientState.direction;

            if(effects.minor) {
                this.effectLabel.text = "Menor";
                this.effectLabel.visible = true;
            }
            else if(effects.skipTurns) {
                this.effectLabel.text = "Saltar " + effects.skipTurns + " turnos"; 
                this.effectLabel.visible = true;
            }
            else {
                this.effectLabel.text = "";
                this.effectLabel.visible = false;
            }

            if(pile.length) {
                let cardDropped = pile[pile.length - 1];
                if(this.game.state.direction > 0) {
                    this.directionLabel1.text = "->";
                    this.directionLabel2.text = "->";
                }
                else {
                    this.directionLabel1.text = "<-";
                    this.directionLabel2.text = "<-";
                }
                this.player.cardPlayed = true;
                this.dropCard(clientId, data.droppedCard, cardDropped)
            }

            if(this.game.state.stackedPile > 1) {
                let pileCountLabel = "x" + this.game.state.stackedPile;
                this.pileCountLabel.text = pileCountLabel;
                this.pileCountLabel.visible = true;
            }
            else {
                this.pileCountLabel.visible = false;
            }
        });

        this.socket.on('pickUpCard', (data) => {
            console.log("[pickUpCard]", data);
            this.addCardToHand(data.clientId, data.pickUpCard);
            let deskCountText = "x" + data.deskCount;
            this.deskCountLabel.text = deskCountText;
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
                if(this.checkPickUpPile()) {
                    this.pileCountLabel.visible = false;
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

        this.socket.on('discardPile', (data) => {
            console.log("[discardPile]", data);
            this.game.state.pile.topCard.cardObject.destroy();
            this.game.state.pile.topCard = null;
            this.game.state.pile.pileData = [];
            this.pileCountLabel.visible = false;
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
                if(!this.checkPlayerCanPlay(cardIndex) || !dropped) {
                    gameObject.x = gameObject.input.dragStartX;
                    gameObject.y = gameObject.input.dragStartY;
                }
            }
        });
        
        this.pileDropZone = this.add.zone(this.canvas.width / 2, this.canvas.height / 2, 100, 130).setRectangleDropZone(100, 130);
        this.input.on('drop', (pointer, gameObject, dropZone) => {
            let cardIndex = gameObject.getData("index");
            // TODO: Add from what cards group was dropped
            let canPlay = this.checkPlayerCanPlay(cardIndex);
            console.log(canPlay);
            if(this.player.inTurn && canPlay) {
                // console.log("Card index(drop):", cardIndex);
                let droppedCard = this.player.hand[cardIndex];
                let droppedCardData = {
                    index: cardIndex,
                    card: {
                        type: droppedCard.type,
                        value: droppedCard.value
                    }
                };

                this.addCardToPile(droppedCardData);
                this.player.dropCardFromHand(cardIndex);
                let payLoad = {
                    gameId: this.game.gameId,
                    clientId: this.clientId,
                    cardIndex: cardIndex
                    // TODO: Add from what cards group was dropped
                };
                this.socket.emit('dropCard', payLoad);
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
            let card = new Card(cardData.index, { type: cardData.card.type, value: cardData.card.value });
            playerCards.hand[cardData.index] = card;
        });

        playerCardsData.lookUp.forEach(cardData => {
            let card = new Card(cardData.index, { type: cardData.card.type, value: cardData.card.value });
            playerCards.lookUp[cardData.index] = card;
        });

        playerCardsData.lookDown.forEach(cardData => {
            let card = new Card(cardData.index);
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
                opponentCards.hand[index] = new Card(index);
            });

            opponent.opponentLookDownIndexes.forEach(index => {
                opponentCards.lookDown[index] = new Card(index);
            });

            opponent.opponentLookUp.forEach(cardData => {
                opponentCards.lookUp[cardData.index] = new Card(cardData.index, { type: cardData.card.type, value: cardData.card.value });;
            });

            this.opponents.push(new Opponent(turn, opponentCards));
        });

        this.opponents = this.sortOpponents(this.player.turn, this.opponents);

        // console.log(gameState);

        this.game.state = {
            pile: {
                pileData: gameState.pile,
                // topCard: Card
            },
            discarded: gameState.discarded,
            direction: gameState.direction,
            actualTurn: gameState.actualTurn,
            turnsCount: gameState.turnsCount,
            deskCount: gameState.deskCount,
            effects: gameState.effects
        };

        let cardData = gameState.pile[gameState.pile.length - 1];  
        this.addCardToPile(cardData);
        
        // console.log(this.player);
        // console.log(this.opponents);
        // console.log(this.game.state);

        this.renderBoard();
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

        let newCard = new Card(cardData.index, { type: cardData.card.type, value: cardData.card.value });
        newCard.makeCardObject(this, this.canvas.width / 2, this.canvas.height / 2);

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

    checkPlayerCanPlay(cardIndex) {
        let effects = this.game.state.effects;
        let pile = this.game.state.pile.pileData;
        let pileEmpty = pile.length ? false : true;
        let pileValue = !pileEmpty ? pile[pile.length - 1].card.value : null;
        let cardValue = this.player.hand[cardIndex].value;

        // console.log("pile empty:", pileEmpty);
        // console.log("card value:", cardValue);
        // console.log("pile value:", pileValue);
        // console.log("card played:", this.player.cardPlayed);
        // console.log("minor:", effects.minor);
        
        if(!this.player.cardPlayed) {
            if(![-1, 1, 2, 9].includes(cardValue)){
                if(!pileEmpty) { 
                    if((effects.minor && cardValue > pileValue) || (!effects.minor && cardValue < pileValue)) {
                        return false;
                    }
                }
            }
        }
        else {
            if(!pileEmpty) {
                if(cardValue != pileValue) {
                    return false;
                }
            }
        }
    
        return true;
    }

    checkPickUpPile() {
        let pile = this.game.state.pile;
        let effects = this.game.state.effects;
        if(pile.pileData.length) {
            let pileValue = pile.pileData[pile.pileData.length - 1].card.value;
            let hand = this.player.hand;
            
            for(const cardIndex in hand) {
                let cardValue = hand[cardIndex].value;
                if([-1, 0, 1, 2].includes(cardValue)) {
                    return false;
                }
                else {
                    if((effects.minor && cardValue <= pileValue) || (!effects.minor && cardValue >= pileValue)) {
                        return false;
                    }
                }
            }
        }

        return true;
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
        this.player.makeCardsObjects(this);
    }

    makeOpponentsCardsObjects() {
        let opponents = this.opponents;

        if(opponents.length == 1) {
            opponents[0].makeCardsObjects(this, "top");
        }
        else if(opponents.length == 2) {
            opponents[0].makeCardsObjects(this, "right");
            opponents[1].makeCardsObjects(this, "left");
        }
        else if(opponents.length == 3) {
            opponents[0].makeCardsObjects(this, "right");
            opponents[1].makeCardsObjects(this, "top");
            opponents[2].makeCardsObjects(this, "left");
        }
    }

    renderBoard() {
        this.makePlayerCardsObjects();
        this.makeOpponentsCardsObjects();
        
        this.deskCard = new Card(0);
        this.deskCard.makeCardObject(this, this.canvas.width / 2 + 100, this.canvas.height / 2);

        let deskCount = this.game.state.deskCount;
        let deskCountText = "x" + deskCount;
        this.deskCountLabel = this.add.text(this.canvas.width / 2 + 150, this.canvas.height / 2 + 33, [deskCountText]).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff');
        
        this.pileCountLabel = this.add.text(this.canvas.width / 2 + 45, this.canvas.height / 2 + 33, "").setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff');
        this.pileCountLabel.visible = false;

        this.effectLabel = this.add.text(this.canvas.width / 2 - 150, this.canvas.height / 2, "").setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff');
        this.effectLabel.visible = false;

        this.directionLabel1 = this.add.text(this.canvas.width * 0.25, 100, ["->"]).setFontSize(24).setFontFamily('Trebuchet MS').setColor('#ffffff');
        this.directionLabel2 = this.add.text(this.canvas.width * 0.75, 100, ["->"]).setFontSize(24).setFontFamily('Trebuchet MS').setColor('#ffffff');

        this.finishButton = this.add.text(1000, 600, ["Terminar turno"]).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff');
        this.finishButton.visible = false;
        this.finishButton.on('pointerdown', () => {
            this.finishButton.disableInteractive();
            this.finishButton.visible = false;
            
            this.player.disableHandInteractions();
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
}