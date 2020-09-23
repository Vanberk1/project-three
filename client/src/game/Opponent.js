export default class Opponent {
    constructor(game, cards, turn) {
        this.currentGame = game;
        this.handIndexes = cards.handIndexes;
        this.lookDownIndexes = cards.lookDownIndexes;
        this.lookUp = cards.lookUp;
        this.turn = turn;
    }

    dropCardFromHand() {
        --this.handCount;
    }

    dropCardFromLookDown() {
        --this.lookDownCount;
    }

    dropCardFromLookUp(index) {
        let lookUp = this.lookUp;
        lookUp.forEach(card => {
            if(index == card.index) {
                let card = lookUp.slide(lookUp.indexOf(card), 1);
                return card;
            }
        });

        return null;
    }

    pickCard() {
        ++this.handCount;
    }
}