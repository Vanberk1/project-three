import Card from './card';

export default class Desk {
    constructor(scene) {
        this.scene = scene;
    }

    dealCards() {

        this.renderPlayerCards();
        this.renderOpponentscards();
    }

    renderPlayerCards() {
        let hand = [];
        let lookDown = [];
        let lookUp = [];

        for(let j = 0; j < 3; j++) {
            let lookDownCard = new Card(this.scene);
            lookDown.push(lookDownCard.init(330 + (j * 70), 500, "blue-card-back"));
            
            let lookUpCard = new Card(this.scene);
            lookUp.push(lookUpCard.init(330 + (j * 70), 480, "red-joker"));
            
            let handCard = new Card(this.scene);
            hand.push(handCard.init(330 + (j * 70), 600, "blue-joker", true));
        }
    }

    renderOpponentscards() {
        {
            for(let i = 0; i < 3; i++) {
                let lookDownCard = new Card(this.scene);
                lookDownCard.init(330 + (i * 70), 100, "blue-card-back");
                lookDownCard.card.angle = 180;
    
                let lookUpCard = new Card(this.scene);
                lookUpCard.init(330 + (i * 70), 120, "red-joker");
                lookUpCard.card.angle = 180;
                
                let handCard = new Card(this.scene);
                handCard.init(330 + (i * 70), 0, "red-card-back", false);
                handCard.card.angle = 180;
            }
        }

        {
            for(let i = 0; i < 3; i++) {
                let lookDownCard = new Card(this.scene);
                lookDownCard.init(100, 200 + (i * 70), "blue-card-back");
                lookDownCard.card.angle = 90;
    
                let lookUpCard = new Card(this.scene);
                lookUpCard.init(120, 200 + (i * 70), "red-joker");
                lookUpCard.card.angle = 90;
                
                let handCard = new Card(this.scene);
                handCard.init(0, 200 + (i * 70), "red-card-back", false);
                handCard.card.angle = 90;
            }
        }

        {
            for(let i = 0; i < 3; i++) {
                let lookDownCard = new Card(this.scene);
                lookDownCard.init(700, 200 + (i * 70), "blue-card-back");
                lookDownCard.card.angle = -90;
    
                let lookUpCard = new Card(this.scene);
                lookUpCard.init(680, 200 + (i * 70), "red-joker");
                lookUpCard.card.angle = -90;
                
                let handCard = new Card(this.scene);
                handCard.init(800, 200 + (i * 70), "red-card-back", false);
                handCard.card.angle = -90;
            }
        }
    }
}