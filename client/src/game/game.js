import Desk from './desk';
import Card from './card';
import io from 'socket.io-client';
import InputText from 'phaser3-rex-plugins/plugins/inputtext.js';

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

    renderDesk(desk) {
        let card = new Card(this);
        card.renderBack(500, 300, "red-card-back");

        let top = desk.getTopOfPile();
        let topCard = new Card(this);
        topCard.renderFront(400, 300, top, false);
    }

    renderPlayerHand() {
        let hand = this.players[0].hand.hand;
        for(let i = 0; i < hand.length; i++) {
            console.log(hand[i].type + " - " + (hand[i].value + 1));
            let handCard = new Card(this);
            handCard.renderFront(330 + (i * 70), 600, hand[i], true);
        }

        let lookDown = this.players[0].hand.lookDown;
        for(let i = 0; i < lookDown.length; i++) {
            let lookDownCard = new Card(this);
            lookDownCard.renderBack(330 + (i * 70), 500, "blue-card-back");
        }
        
        let lookUp = this.players[0].hand.lookUp;
        for(let i = 0; i < lookUp.length; i++) {
            let lookUpCard = new Card(this);
            lookUpCard.renderFront(330 + (i * 70), 480, lookUp[i], false);
        }
    }

    renderOpponentsHands() {
        {
            let hand = this.players[1].hand.hand;
            for(let i = 0; i < hand.length; i++) {
                let handCard = new Card(this);
                handCard.renderBack(330 + (i * 70), 0, "red-card-back");
                handCard.card.angle = 180;
            }

            let lookDown = this.players[1].hand.lookDown;
            for(let i = 0; i < lookDown.length; i++) {
                let lookDownCard = new Card(this);
                lookDownCard.renderBack(330 + (i * 70), 100, "blue-card-back");
                lookDownCard.card.angle = 180;
            }
            
            let lookUp = this.players[1].hand.lookUp;
            for(let i = 0; i < lookUp.length; i++) {
                let lookUpCard = new Card(this);
                lookUpCard.renderFront(330 + (i * 70), 120, lookUp[i], false);
                lookUpCard.card.angle = 180;
            }
        }

        {
            let hand = this.players[2].hand.hand;
            for(let i = 0; i < hand.length; i++) {
                let handCard = new Card(this);
                handCard.renderBack(0, 200 + (i * 70), "red-card-back");
                handCard.card.angle = 90;
            }

            let lookDown = this.players[2].hand.lookDown;
            for(let i = 0; i < lookDown.length; i++) {
                let lookDownCard = new Card(this);
                lookDownCard.renderBack(100, 200 + (i * 70), "blue-card-back");
                lookDownCard.card.angle = 90;
            }
            
            let lookUp = this.players[2].hand.lookUp;
            for(let i = 0; i < lookUp.length; i++) {
                let lookUpCard = new Card(this);
                lookUpCard.renderFront(120, 200 + (i * 70), lookUp[i], false);
                lookUpCard.card.angle = 90;
            }

        }

        {
            let hand = this.players[3].hand.hand;
            for(let i = 0; i < hand.length; i++) {
                let handCard = new Card(this);
                handCard.renderBack(800, 200 + (i * 70), "red-card-back");
                handCard.card.angle = -90;
            }

            let lookDown = this.players[3].hand.lookDown;
            for(let i = 0; i < lookDown.length; i++) {
                let lookDownCard = new Card(this);
                lookDownCard.renderBack(700, 200 + (i * 70), "blue-card-back");
                lookDownCard.card.angle = -90;
            }
            
            let lookUp = this.players[3].hand.lookUp;
            for(let i = 0; i < lookUp.length; i++) {
                let lookUpCard = new Card(this);
                lookUpCard.renderFront(680, 200 + (i * 70), lookUp[i], false);
                lookUpCard.card.angle = -90;
            }
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
            console.log(data);
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