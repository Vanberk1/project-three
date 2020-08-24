import Desk from './desk';
import Player from './player';
import Card from './card';

export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: "Game"
        });
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
                lookUpCard.renderFront(330 + (i * 70), lookUp[i], false);
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

        this.players = [];

        for(let i = 0; i < 4; i++) {
            let player = new Player(this, i);
            this.players.push(player);
        }
                
        this.dealText = this.add.text(50, 50, ['Repartir']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.dealText.on('pointerdown', () => {
            this.desk = new Desk(this);
            this.desk.dealCards(this.players);
            this.dealText.visible = false;
            this.renderDesk(this.desk);
            this.renderPlayerHand();
            this.renderOpponentsHands();
        })



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