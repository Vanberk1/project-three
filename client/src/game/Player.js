export default class Player {
    constructor(game, handState, turn) {
        this.hand = handState.hand
        this.lookUp = handState.lookUp
        this.lookDown = handState.lookDown
        this.turn = turn
        this.inTurn = false
    }

    setTurn(turn) {
        this.inTurn = turn
    }

    dropCardFromHand(index) {
        let hand = this.hand;
        hand.forEach(card => {
            if(index == card.index) {
                let card = hand.slide(hand.indexOf(card), 1);
                return card;
            }
        });

        return null;
    }

    pickCard(card) {
        if(card != null) {
            this.hand.push(card);
        }
    }

}