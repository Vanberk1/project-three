import Card from './card';

const types = {
    CLUB: 'club',
    DIAMOND: 'diamond',
    HEART: 'heart',
    SPADE: 'spade',
    JOKER: 'joker'
};

export default class Desk {
    constructor(scene) {
        this.scene = scene;
        this.desk = [
            { type: types.JOKER, value: -1 }, 
            { type: types.JOKER, value: -1 }, 
            { type: types.CLUB, value: 0 }, 
            { type: types.CLUB, value: 1 }, 
            { type: types.CLUB, value: 2 }, 
            { type: types.CLUB, value: 3 }, 
            { type: types.CLUB, value: 4 }, 
            { type: types.CLUB, value: 5 }, 
            { type: types.CLUB, value: 6 }, 
            { type: types.CLUB, value: 7 }, 
            { type: types.CLUB, value: 8 }, 
            { type: types.CLUB, value: 9 }, 
            { type: types.CLUB, value: 10 }, 
            { type: types.CLUB, value: 11 }, 
            { type: types.CLUB, value: 12 }, 
            { type: types.DIAMOND, value: 0 }, 
            { type: types.DIAMOND, value: 1 }, 
            { type: types.DIAMOND, value: 2 }, 
            { type: types.DIAMOND, value: 3 }, 
            { type: types.DIAMOND, value: 4 }, 
            { type: types.DIAMOND, value: 5 }, 
            { type: types.DIAMOND, value: 6 }, 
            { type: types.DIAMOND, value: 7 }, 
            { type: types.DIAMOND, value: 8 }, 
            { type: types.DIAMOND, value: 9 }, 
            { type: types.DIAMOND, value: 10 }, 
            { type: types.DIAMOND, value: 11 }, 
            { type: types.DIAMOND, value: 12 }, 
            { type: types.HEART, value: 0 }, 
            { type: types.HEART, value: 1 }, 
            { type: types.HEART, value: 2 }, 
            { type: types.HEART, value: 3 }, 
            { type: types.HEART, value: 4 }, 
            { type: types.HEART, value: 5 }, 
            { type: types.HEART, value: 6 }, 
            { type: types.HEART, value: 7 }, 
            { type: types.HEART, value: 8 }, 
            { type: types.HEART, value: 9 }, 
            { type: types.HEART, value: 10 }, 
            { type: types.HEART, value: 11 }, 
            { type: types.HEART, value: 12 }, 
            { type: types.SPADE, value: 0 }, 
            { type: types.SPADE, value: 1 }, 
            { type: types.SPADE, value: 2 }, 
            { type: types.SPADE, value: 3 }, 
            { type: types.SPADE, value: 4 }, 
            { type: types.SPADE, value: 5 }, 
            { type: types.SPADE, value: 6 }, 
            { type: types.SPADE, value: 7 }, 
            { type: types.SPADE, value: 8 }, 
            { type: types.SPADE, value: 9 }, 
            { type: types.SPADE, value: 10 }, 
            { type: types.SPADE, value: 11 }, 
            { type: types.SPADE, value: 12 }, 
        ];
        this.pile = [];
        this.discarted = [];
        this.topDesk;
    }

    dealCards(players) {

        for(let i = 0; i < players.length; i++) {
            for(let j = 0; j < 3; j++) {
                let cardIndex = Math.floor(Math.random() * this.desk.length);
                players[i].addCardToHand(this.desk.splice(cardIndex, 1)[0]);
            }

            for(let j = 0; j < 3; j++) {
                let cardIndex = Math.floor(Math.random() * this.desk.length);
                players[i].addCardToLookUp(this.desk.splice(cardIndex, 1)[0]);
            }

            for(let j = 0; j < 3; j++) {
                let cardIndex = Math.floor(Math.random() * this.desk.length);
                players[i].addCardToLookDown(this.desk.splice(cardIndex, 1)[0]);
            }
        }
        let cardIndex = Math.floor(Math.random() * this.desk.length);
        this.top = this.desk.splice(cardIndex, 1)[0];
        this.pile.push(this.desk.splice(cardIndex, 1)[0]);

        console.log(this.desk);
        players.forEach(player => {
            console.log("Player " + player.id);
            console.log("Hand: ");
            player.hand.hand.forEach(card => {
                console.log(card.value + " - " + card.type)
            });
            console.log("Look up: ");
            player.hand.lookUp.forEach(card => {
                console.log(card.value + " - " + card.type)
            });
            console.log("Look down: ");
            player.hand.lookDown.forEach(card => {
                console.log(card.value + " - " + card.type)
            });
            console.log("");
        });

        console.log("Top: " + this.top.value + " - " + this.top.type)
        console.log("Pile: " + this.getTopOfPile().value + " - " + this.getTopOfPile().type)
    }

    getTopDesk() {
        return this.top;
    }

    addToPile(card) {
        this.pile.push(card);
    }

    getTopOfPile() {
        return this.pile[this.pile.length - 1];
    }
}