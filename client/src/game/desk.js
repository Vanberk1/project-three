import Card from './card';

export default class Desk {
    constructor(scene) {
        this.scene = scene;
    }

    dealCards(players, playersCount) {
        for(let i = 0; i < playersCount; i++) {
            let hand = [];
            let lookDown = [];
            let lookUp = [];
            for(let j = 0; j < 3; j++) {
                let lookDownCard = new Card(this.scene);
                lookDown.push(lookDownCard.init(200 + (j * 100), 350, "blue-card-back"));
                
                let lookUpCard = new Card(this.scene);
                lookUp.push(lookUpCard.init(200 + (j * 100), 300, "red-joker"));
                
                let handCard = new Card(this.scene);
                hand.push(handCard.init(200 + (j * 100), 500, "blue-joker", true));
            }

            players.push({
                hand,
                lookDown,
                lookUp
            });
        }
    }

}