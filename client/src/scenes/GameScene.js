import heartSheet from "../assets/heart-sheet.png";
import clubSheet from "../assets/club-sheet.png";
import diamondSheet from "../assets/diamond-sheet.png";
import spadeSheet from "../assets/spade-sheet.png";
import blueCard from "../assets/blue-card-back.png";
import redCard from "../assets/red-card-back.png";
import blueJoker from "../assets/blue-joker.png";
import redJoker from "../assets/red-joker.png";
import logo from "../assets/logo.png";

import Card from '../gameObjects/Card';
import Player from '../gameObjects/Player';
import Opponent from '../gameObjects/Opponent';

export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: 'game'
        });

        this.game = null;
        this.player = null;
        this.opponents = [];
    }

    init(data) {
        this.scene.pause('lobby');
        this.socket = this.registry.get('socket');
        this.gameId = data.gameId;
        this.clientId = this.socket.id;
        this.clients = data.clients;
        this.gameData = data.clientState;
    }

    preload() {
        this.load.spritesheet("heart", heartSheet, { frameWidth: 35, frameHeight: 47 });
        this.load.spritesheet("club", clubSheet, { frameWidth: 35, frameHeight: 47 });
        this.load.spritesheet("diamond", diamondSheet, { frameWidth: 35, frameHeight: 47 });
        this.load.spritesheet("spade", spadeSheet, { frameWidth: 35, frameHeight: 47 });
        this.load.image("blue-card-back", blueCard);
        this.load.image("red-card-back", redCard);
        this.load.image("blue-joker", blueJoker);
        this.load.image("red-joker", redJoker);
        this.load.image("logo", logo);

        this.canvas = this.sys.game.canvas;
    }   

    create() {
        this.cameras.main.setBackgroundColor("#25282D");

        
        this.socket.on('dropCard', data => {
            console.log("[dropCard]", data);
            let pile = data.clientState.pile;
            let clientId = data.clientPlaying;
            this.game.state.pile.pileData = pile;
            this.game.state.stackedPile = data.clientState.stackedPile;
            this.game.state.direction = data.clientState.direction;

            if(pile.length) {
                let cardDropped = pile[pile.length - 1];
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

        this.socket.on('pickUpCard', data => {
            console.log("[pickUpCard]", data);
            this.addCardToHand(data.clientId, data.pickUpCard);
            let deskCountText = "x" + data.deskCount;
            this.deskCountLabel.text = deskCountText;
            if(data.deskCount === 0) {
                this.deskCard.visible = false;
            }
        });

        this.socket.on('changeTurn', data => {
            this.actualTurn = data.actualTurn;
            this.turnsCount = data.turnsCount;
            console.log("[changeTurn]", data);

            if(data.skipTurns) {
                this.effectLabel.text = "";
                this.effectLabel.visible = false;
            }

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
            this.effectLabel.text = "";
            this.effectLabel.visible = false;

            if(this.player.turn == data.turn) {
                this.player.inTurn = true;
                this.player.cardPlayed = false;
                this.player.enableHandInteractions();
                this.finishButton.setInteractive();
                this.finishButton.visible = true;
            }
            else {
                this.player.disableHandInteractions();
                this.finishButton.disableInteractive();
                this.finishButton.visible = false;
            }
        });

        this.socket.on('discardPile', (data) => {
            console.log("[discardPile]", data);
            setTimeout(() => {
                this.game.state.pile.topCard.cardObject.destroy();
                this.game.state.pile.topCard = null;
                this.game.state.pile.pileData = [];
                this.pileCountLabel.visible = false;
            }, 1000);
            this.effectLabel.text = "";
            this.effectLabel.visible = false;
        });

        this.socket.on('applyEffects', (data) => {
            console.log("[applyEffects]", data);
            let direction = data.direction;
            let effects = data.effects;
            this.game.state.effects = effects;

            if(effects.minor) {
                this.effectLabel.text = "Menor";
                this.effectLabel.visible = true;
            }
            else if(effects.transparent) {
                let pileValue;
                let pile = this.game.state.pile.pileData;
                for(let i = pile.length - 1; i >= 0; i--) {
                    if(pile[i].card.value != 2) {
                        pileValue = pile[i].card.value;
                        break;
                    }
                }
                this.effectLabel.text = "Transparente:\n" + (pileValue + 1);
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

            if(direction > 0) {
                this.directionLabel1.text = "->";
                this.directionLabel2.text = "->";
            }
            else {
                this.directionLabel1.text = "<-";
                this.directionLabel2.text = "<-";
            }
        });

        this.socket.on('resetEffects', (data) => {
            console.log("[resetEffects]", data);
            let effects = data.effects;
            this.game.state.effects = effects;

            this.effectLabel.text = "";
            this.effectLabel.visible = false;
        });

        this.createGame(this.gameData);

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
        
        this.pileDropZone = this.add.zone(this.canvas.width / 2, this.canvas.height / 2, 100, 130);
        this.pileDropZone.setRectangleDropZone(100, 130);
        this.input.on('drop', (pointer, gameObject, dropZone) => {
            let cardIndex = gameObject.getData("index");
            // TODO: Add from what cards group was dropped
            let canPlay = this.checkPlayerCanPlay(cardIndex);
            // console.log("can play:", canPlay);
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
                console.log(this.game);
                let payLoad = {
                    gameId: this.gameId,
                    clientId: this.clientId,
                    cardIndex: cardIndex
                    // TODO: Add from what cards group was dropped
                };
                this.socket.emit('dropCard', payLoad);
            }
        });
    }

    makePlayerCardsObjects() {
        this.player.makeCardsObjects(this);
        this.add.text(730, 600, this.player.name).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff');
    }

    makeOpponentsCardsObjects() {
        let opponents = this.opponents;

        if(opponents.length == 1) {
            opponents[0].makeCardsObjects(this, "top");
            this.add.text(330, 180, opponents[0].name).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff');
        }
        else if(opponents.length == 2) {
            opponents[0].makeCardsObjects(this, "right");
            this.add.text(950, 250, opponents[0].name).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff');
            opponents[1].makeCardsObjects(this, "left");
            this.add.text(150, 550, opponents[1].name).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff');
        }
        else if(opponents.length == 3) {
            opponents[0].makeCardsObjects(this, "right");
            this.add.text(950, 250, opponents[0].name).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff');
            opponents[1].makeCardsObjects(this, "top");
            this.add.text(330, 180, opponents[1].name).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff');
            opponents[2].makeCardsObjects(this, "left");
            this.add.text(150, 550, opponents[2].name).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff');
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
            console.log("finish turn");
    
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

    createGame(gameState) {
        console.log(gameState);
        // Create player state
        let playerTurn = gameState.clientCards.turn;
        let playerName = gameState.clientCards.name;
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

        this.player = new Player(playerTurn, playerName, playerCards);
        if(playerTurn == gameState.actualTurn) {
            this.player.inTurn = true;
        }

        // Create opponents states
        let opponentsCards = gameState.opponentsCards;
        opponentsCards.forEach(opponent => {
            let name = opponent.name;
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

            this.opponents.push(new Opponent(turn, name, opponentCards));
        });

        this.opponents = this.sortOpponents(this.player.turn, this.opponents);

        // console.log(gameState);

        this.game = {
            gameId: this.gameId,
            state: {
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
            }
        };

        let cardData = gameState.pile[gameState.pile.length - 1];  
        // this.addCardToPile(cardData);
        
        // console.log(this.player);
        // console.log(this.opponents);
        // console.log(this.game.state);

        this.renderBoard();
    } 

    dropCard(clientId, droppedCardIndex, cardData) {
        console.log(cardData);
        let playerTurn = this.clients[clientId].turn;
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
        let playingTurn = this.clients[playerId].turn; 
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
        console.log(this.game.state.pile);
        if(this.game.state.pile.topCard) {
            this.game.state.pile.topCard.cardObject.destroy();
        }
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

        if(effects.transparent) {
            for(let i = pile.length - 1; i >= 0; i--) {
                if(pile[i].card.value != 2) {
                    pileValue = pile[i].card.value;
                    break;
                }
            }
        }

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
        let pile = this.game.state.pile.pileData;
        let effects = this.game.state.effects;
        if(pile.length) {
            let pileValue = pile[pile.length - 1].card.value;

            if(effects.transparent) {
                for(let i = pile.length - 1; i >= 0; i--) {
                    if(pile[i].card.value != 2) {
                        pileValue = pile[i].card.value;
                        break;
                    }
                }
            }

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

            return true;
        }

        return false;
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