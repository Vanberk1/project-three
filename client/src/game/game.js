import io from 'socket.io-client';
import InputText from 'phaser3-rex-plugins/plugins/inputtext.js';

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

    drawLobby() {
        this.createGameButton.visible = false;
        this.joinGameButton.visible = false;
        this.inputText.visible = false;

        console.log("Client id: " + this.clientId);
        console.log("Host id: " + this.game.hostId);

        if(this.player.id == this.game.hostId) {
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
        for(let i = 0; i < players.length; i++) {
            let playerName = "Player " + players[i];
            this.playersNames.push(this.add.text(200, 50 + (i * 25), [playerName]).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffffff'));
        }
    }

    renderPlayerHand() {
        let playerCards = this.game.state.clientCards;
        let hand = playerCards.hand;
        for(let i = 0; i < hand.length; i++) {
            let card;
            console.log("Hand: " + types[hand[i].type] + " - " + (hand[i].value + 1));
            if(hand[i].value != -1) {
                let spritesheet = types[hand[i].type] + "-sheet";
                card = this.add.image(330 + (i * 70), 600, spritesheet, hand[i].value).setScale(2.0, 2.0).setInteractive();
            }
            else {
                card = this.add.image(330 + (i * 70), 600, "blue-joker").setScale(2.0, 2.0).setInteractive();
            }
            this.makeDraggeable(card);
        }

        let lookDown = playerCards.lookDown;
        for(let i = 0; i < lookDown.length; i++) {
            this.add.image(330 + (i * 70), 500, "blue-card-back").setScale(2.0, 2.0);
        }
        
        let lookUp = playerCards.lookUp;
        for(let i = 0; i < lookUp.length; i++) {
            let card;
            console.log("Look up: " + types[lookUp[i].type] + " - " + (lookUp[i].value + 1));
            if(lookUp[i].value != -1) {
                let spritesheet = types[lookUp[i].type] + "-sheet";
                this.add.image(330 + (i * 70), 480, spritesheet, lookUp[i].value).setScale(2.0, 2.0).setInteractive();
            }
            else {
                this.add.image(330 + (i * 70), 480, "blue-joker").setScale(2.0, 2.0).setInteractive();
            }
        }
    }

    renderOpponentsHands() {
        let opponentsCards = this.game.state.opponentsCards;

        for(let i = 0; i < opponentsCards.length; i++) {
            if(i == 0) {
                let handCount = opponentsCards[i].opponentHandCount;
                for(let i = 0; i < handCount; i++) {
                    let card = this.add.image(330 + (i * 70), 0, "red-card-back").setScale(2.0, 2.0);
                    card.angle = 180;
                }
    
                let lookDownCount = opponentsCards[i].opponentLookDownCount;
                for(let i = 0; i < lookDownCount; i++) {
                    let card = this.add.image(330 + (i * 70), 100, "blue-card-back").setScale(2.0, 2.0);
                    card.angle = 180;
                }
                
                let lookUp = opponentsCards[i].opponentLookUp;
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
                    card.angle = 180;
                }
            }
    
            if(i == 1) {
                let handCount = opponentsCards[i].opponentHandCount;
                for(let i = 0; i < handCount; i++) {
                    let card = this.add.image(0, 200 + (i * 70), "red-card-back").setScale(2.0, 2.0);
                    card.angle = 90;
                }
    
                let lookDownCount = opponentsCards[i].opponentLookDownCount;
                for(let i = 0; i < lookDownCount; i++) {
                    let card = this.add.image(100, 200 + (i * 70), "blue-card-back").setScale(2.0, 2.0);
                    card.angle = 90;
                }
                
                let lookUp = opponentsCards[i].opponentLookUp;
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
                    card.angle = 90;
                }
            }
    
            if(i == 2) {
                let handCount = opponentsCards[i].opponentHandCount;
                for(let i = 0; i < handCount; i++) {
                    let card = this.add.image(800, 200 + (i * 70), "red-card-back").setScale(2.0, 2.0);
                    card.angle = -90;
                }
    
                let lookDownCount = opponentsCards[i].opponentLookDownCount;
                for(let i = 0; i < lookDownCount; i++) {
                    let card = this.add.image(700, 200 + (i * 70), "blue-card-back").setScale(2.0, 2.0);
                    card.angle = -90;
                }
                
                let lookUp = opponentsCards[i].opponentLookUp;
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
                    card.angle = -90;
                }
            }
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

    drawBoard() {
        let pile = this.game.state.pile;
        let top = this.game.state.top;

        this.renderPlayerHand();
        this.renderOpponentsHands();

        this.add.image(500, 300, "red-card-back").setScale(2.0, 2.0);

        let topPile = pile[pile.length - 1];
        if(topPile.value != -1) {
            let spritesheet = types[topPile.type] + "-sheet";
            this.add.image(400, 300, spritesheet, topPile.value).setScale(2.0, 2.0);
        }
        else {
            this.add.image(400, 300, + (i * 70), "blue-joker").setScale(2.0, 2.0);
        }
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

    create() {
        let self = this;

        // Client state

        this.player = null;
        this.game = null;
        this.opponents = [];
        
        // Socket connection
        this.socket = io.connect('http://localhost:3000');

        this.socket.on('connect', () => {
            console.log("Connected");
        });

        this.socket.on('newClient', (data) => {
            self.player = {
                id: data.clientId
            };
            console.log(self.player);
        });

        this.socket.on('createGame', (data) => {
            self.game = data.game;
            console.log(self.game);
            self.drawLobby();
        });

        this.socket.on('joinGame', (data) => {
            self.game = data.game;
            console.log(self.game);
            self.drawLobby();
        });

        this.socket.on('startGame', (data) => {
            if(this.dealText) {
                this.dealText.visible = false;
            }
            this.playersNames.forEach(name => {
                name.visible = false;
            });
            this.game.state = data.clientState;
            console.log(data.clientState);
            self.drawBoard();
        });


        // Game elements
        this.createGameButton = this.add.text(100, 100, ['Crear partida']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.createGameButton.on('pointerdown', () => {
            let payLoad = {
                clientId: self.player.id
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
                    clientId: self.player.id,
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
}