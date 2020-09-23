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

    preload() {
        this.load.spritesheet("heart-sheet", "src/assets/heart-sheet.png", { frameWidth: 35, frameHeight: 47 });
        this.load.spritesheet("club-sheet", "src/assets/club-sheet.png", { frameWidth: 35, frameHeight: 47 });
        this.load.spritesheet("diamond-sheet", "src/assets/diamond-sheet.png", { frameWidth: 35, frameHeight: 47 });
        this.load.spritesheet("spade-sheet", "src/assets/spade-sheet.png", { frameWidth: 35, frameHeight: 47 });
        this.load.image("blue-card-back", "src/assets/blue-card-back.png");
        this.load.image("red-card-back", "src/assets/red-card-back.png");
        this.load.image("blue-joker", "src/assets/blue-joker.png");
        this.load.image("red-joker", "src/assets/red-joker.png");
    }

    socketConnections() {
        let self = this;
        
        this.socket = io.connect('http://localhost:3000');

        this.socket.on('connect', () => {
            console.log("Connected");
        });

        this.socket.on('newClient', (data) => {
            self.clientId = data.clientId;
            console.log(self.clientId);
        });

        this.socket.on('createGame', (data) => {
            self.gameState = data.game;
            console.log(self.gameState);
            self.drawLobby();
        });

        this.socket.on('joinGame', (data) => {
            self.gameState = data.game;
            console.log(self.gameState);
            if(this.dealText) {
                this.dealText.destroy();
            }
            if(this.playersNames) {
                this.playersNames.forEach(name => {
                    name.destroy();
                });
            }
            self.drawLobby();
        });

        this.socket.on('startGame', (data) => {
            if(this.dealText) {
                this.dealText.destroy();
            }
            this.playersNames.forEach(name => {
                name.destroy();
            });
            this.gameState.state = data.clientState;
            this.createGame(data.clientState);
            //self.drawBoard();
        });
    }

    create() {
        let self = this;

        // Client state
        this.player = null;
        this.game = null;
        this.opponents = [];
    
        this.socketConnections();

        // Game elements
        this.createGameButton = this.add.text(100, 100, ['Crear partida']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.createGameButton.on('pointerdown', () => {
            let payLoad = {
                clientId: self.clientId
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
                    clientId: self.clientId,
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

        this.input.on('dragstart', function (pointer, gameObject) {
            gameObject.setTint(0xff69b4);
            self.children.bringToTop(gameObject);
        })

        this.input.on('dragend', function (pointer, gameObject) {
            gameObject.setTint();
            gameObject.x = gameObject.input.dragStartX;
            gameObject.y = gameObject.input.dragStartY;
        })
    }

    update() {
    }

    sortOpponents(playerTurn, opponents) {
        console.log(playerTurn);
        console.log(opponents);

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

    createGame(gameState) {
        let pile = gameState.pile.map(card => {
            return new Card(true, card.index, { type: card.card.type, value: card.card.value });
        });

        this.gameState = {
            pile: pile,
            discarded: []
        };

        console.log(this.gameState)

        //Create player hand
        let playerTurn = gameState.clientCards.turn;
        let playerCardsData = gameState.clientCards;
        let playerCards = {}
        playerCards.hand = playerCardsData.hand.map(cardData => {
            return new Card(true, cardData.index, { type: cardData.card.type, value: cardData.card.value });
        });
        playerCards.lookUp = playerCardsData.lookUp.map(cardData => {
            return new Card(true, cardData.index, { type: cardData.card.type, value: cardData.card.value });
        });
        playerCards.lookDown = playerCardsData.lookDown.map(cardData => {
            return new Card(false, cardData.index);
        });

        this.player = new Player(this, playerCards, playerTurn);
        console.log(this.player);

        //Create opponents hands
        let opponentsCards = gameState.opponentsCards;
        opponentsCards.forEach(opponent => {
            let turn = opponent.turn;
            let hand = opponent.opponentHandIndexes.map(index => {
                return new Card(false, index);
            });
            let lookDown = opponent.opponentLookDownIndexes.map(index => {
                return new Card(false, index);
            });
            let lookUp = opponent.opponentLookUp.map(cardData => {
                return new Card(true, cardData.index, { type: cardData.card.type, value: cardData.card.value });
            });

            let opponentCards = {
                handIndexes: hand,
                lookDownIndexes: lookDown,
                lookUp: lookUp
            }

            this.opponents.push(new Opponent(this, opponentCards, turn));
        });

        this.opponents = this.sortOpponents(this.player.turn, this.opponents)
        console.log(this.opponents);

        this.renderBoard();
    }

    
    drawLobby() {
        if(this.createGameButton) this.createGameButton.destroy();
        if(this.joinGameButton) this.joinGameButton.destroy()
        if(this.inputText) this.inputText.destroy();

        console.log("Client id: " + this.clientId);
        console.log("Host id: " + this.gameState.hostId);

        if(this.clientId == this.gameState.hostId) {
            this.dealText = this.add.text(50, 50, ['Repartir']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
            this.dealText.on('pointerdown', () => {
                let payLoad = {
                    gameId: this.gameState.gameId 
                }
                this.socket.emit('startGame', payLoad);
            });
        }

        this.playersNames = [];
        let players = this.gameState.clients;
        let i = 0;
        for(const id in players) {
            let playerName = "Player " + id + " Turn: " + players[id];
            this.playersNames.push(this.add.text(200, 50 + (i * 25), [playerName]).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff'));
            i++
        }
    }

    renderPlayerHand() {
        let playerHand = this.player.hand
        for(let i = 0; i < playerHand.length; i++) {
            let card;
            if(playerHand[i].value != -1) {
                let spritesheet = types[playerHand[i].type] + "-sheet";
                card = this.add.image(330 + (i * 70), 600, spritesheet, playerHand[i].value).setScale(2.0, 2.0).setInteractive();
                card.setDataEnabled();
                card.data.set("index", playerHand[i].index);
            }
            else {
                card = this.add.image(330 + (i * 70), 600, "blue-joker").setScale(2.0, 2.0).setInteractive();
                card.setDataEnabled();
                card.data.set("index", playerHand[i].index);
            }
            this.makeDraggeable(card);
        }

        let lookDown = this.player.lookDown;
        for(let i = 0; i < lookDown.length; i++) {
            let card = this.add.image(330 + (i * 70), 500, "blue-card-back").setScale(2.0, 2.0);
            card.setDataEnabled();
            card.data.set("index", lookDown[i].index);
        }
        
        let lookUp = this.player.lookUp;
        for(let i = 0; i < lookUp.length; i++) {
            let card;
            console.log("Look up: " + types[lookUp[i].type] + " - " + (lookUp[i].value + 1));
            if(lookUp[i].value != -1) {
                let spritesheet = types[lookUp[i].type] + "-sheet";
                card = this.add.image(330 + (i * 70), 480, spritesheet, lookUp[i].value).setScale(2.0, 2.0).setInteractive();
            }
            else {
                card = this.add.image(330 + (i * 70), 480, "blue-joker").setScale(2.0, 2.0).setInteractive();
            }
            card.setDataEnabled();
            card.data.set("index", lookUp[i].index);
        }
    }

    renderTopOpponent(opponent) {
        let hand = opponent.handIndexes;
        for(let i = 0; i < hand.length; i++) {
            let card = this.add.image(330 + (i * 70), 0, "red-card-back").setScale(2.0, 2.0);
            card.setDataEnabled();
            card.data.set("index", hand[i].index);
            card.angle = 180;
        }

        let lookDown = opponent.lookDownIndexes;
        for(let i = 0; i < lookDown.length; i++) {
            let card = this.add.image(330 + (i * 70), 100, "blue-card-back").setScale(2.0, 2.0);
            card.setDataEnabled();
            card.data.set("index", lookDown[i].index);
            card.angle = 180;
        }
        
        let lookUp = opponent.lookUp;
        for(let i = 0; i < lookUp.length; i++) {
            let card;
            console.log("Look up: " + types[lookUp[i].type] + " - " + (lookUp[i].value + 1));
            if(lookUp[i].value != -1) {
                let spritesheet = types[lookUp[i].type] + "-sheet";
                card = this.add.image(330 + (i * 70), 120, spritesheet, lookUp[i].value).setScale(2.0, 2.0);
            }
            else {
                card = this.add.image(330 + (i * 70), 120, "blue-joker").setScale(2.0, 2.0);
            }
            card.setDataEnabled();
            card.data.set("index", lookUp[i].index);
            card.angle = 180;
        }
    }

    renderRightOpponent(opponent) {
        let hand = opponent.handIndexes;
        for(let i = 0; i < hand.length; i++) {
            let card = this.add.image(0, 200 + (i * 70), "red-card-back").setScale(2.0, 2.0);
            card.setDataEnabled();
            card.data.set("index", hand[i].index);
            card.angle = 90;
        }

        let lookDown = opponent.lookDownIndexes;
        for(let i = 0; i < lookDown.length; i++) {
            let card = this.add.image(100, 200 + (i * 70), "blue-card-back").setScale(2.0, 2.0);
            card.setDataEnabled();
            card.data.set("index", lookDown[i].index);
            card.angle = 90;
        }
        
        let lookUp = opponent.lookUp;
        for(let i = 0; i < lookUp.length; i++) {
            let card;
            console.log("Look up: " + types[lookUp[i].type] + " - " + (lookUp[i].value + 1));
            if(lookUp[i].value != -1) {
                let spritesheet = types[lookUp[i].type] + "-sheet";
                card = this.add.image(120, 200 + (i * 70), spritesheet, lookUp[i].value).setScale(2.0, 2.0);
            }
            else {
                card = this.add.image(120, 200 + (i * 70), "blue-joker").setScale(2.0, 2.0);
            }
            card.setDataEnabled();
            card.data.set("index", lookUp[i].index);
            card.angle = 90;
        }
    }

    renderLeftOpponent(opponent) {
        let hand = opponent.handIndexes;
        for(let i = 0; i < hand.length; i++) {
            let card = this.add.image(800, 200 + (i * 70), "red-card-back").setScale(2.0, 2.0);
            card.setDataEnabled();
            card.data.set("index", hand[i].index);
            card.angle = -90;
        }

        let lookDown = opponent.lookDownIndexes;
        for(let i = 0; i < lookDown.length; i++) {
            let card = this.add.image(700, 200 + (i * 70), "blue-card-back").setScale(2.0, 2.0);
            card.setDataEnabled();
            card.data.set("index", lookDown[i].index);
            card.angle = -90;
        }
        
        let lookUp = opponent.lookUp;
        for(let i = 0; i < lookUp.length; i++) {
            let card;
            console.log("Look up: " + types[lookUp[i].type] + " - " + (lookUp[i].value + 1));
            if(lookUp[i].value != -1) {
                let spritesheet = types[lookUp[i].type] + "-sheet";
                card = this.add.image(680, 200 + (i * 70), spritesheet, lookUp[i].value).setScale(2.0, 2.0);
            }
            else {
                card = this.add.image(680, 200 + (i * 70), "blue-joker").setScale(2.0, 2.0);
            }
            card.setDataEnabled();
            card.data.set("index", lookUp[i].index);
            card.angle = -90;
        }
    }

    renderOpponentsHands() {
        let opponents = this.opponents;

        if(opponents.length == 1) {
            this.renderTopOpponent(opponents[0]);
        }
        else if(opponents.length == 2) {
            this.renderRightOpponent(opponents[0]);
            this.renderLeftOpponent(opponents[1]);
        }
        else if(opponents.length == 3) {
            this.renderRightOpponent(opponents[0]);
            this.renderTopOpponent(opponents[1]);
            this.renderLeftOpponent(opponents[2]);
        }
    }

    makeDraggeable(card) {
        this.input.setDraggable(card);
        card.on("pointerover", () => {
            card.y -= 50;
            card.setScale(3.0, 3.0);
            this.children.bringToTop(card);
        });
        
        card.on("pointerout", () => {
            card.y += 50;
            card.setScale(2.0, 2.0);
        });
    }

    renderBoard() {
        let pile = this.gameState.pile;

        this.renderPlayerHand();
        this.renderOpponentsHands();

        this.add.image(500, 300, "red-card-back").setScale(2.0, 2.0);
        let top = this.add.image(500, 300, "red-card-back").setScale(2.0, 2.0).setInteractive();
        this.input.setDraggable(top);
        top.on("pointerover", () => {
            top.setScale(3.0, 3.0);
            this.children.bringToTop(top);
        });
        top.on("pointerout", () => {
            top.setScale(2.0, 2.0);
        });

        let topPile = pile[pile.length - 1];
        if(topPile.value != -1) {
            let spritesheet = types[topPile.type] + "-sheet";
            this.add.image(400, 300, spritesheet, topPile.value).setScale(2.0, 2.0);
        }
        else {
            this.add.image(400, 300, + (i * 70), "blue-joker").setScale(2.0, 2.0);
        }
    }
}