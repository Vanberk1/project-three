import Desk from './desk';

export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: "Game"
        });
    }

    preload() {
        this.load.image("blue-card-back", "src/assets/blue-card-back.png");
        this.load.image("red-card-back", "src/assets/red-card-back.png");
        this.load.image("blue-joker", "src/assets/blue-joker.png");
        this.load.image("red-joker", "src/assets/red-joker.png");
    }

    create() {
        let self = this;

        this.players = [];

        this.desk = new Desk(this);
        this.desk.dealCards(this.players, 1);

        // this.card = new Card(this);
        // this.card = this.card.init(300, 300, "blue-card-back");

        // this.card.on("pointerover", () => {
        //     this.card.setScale(3.5, 3.5);
        // });

        // this.card.on("pointerout", () => {
        //     this.card.setScale(3.0, 3.0);
        // });

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
        })
    }

    update() {

    }
}