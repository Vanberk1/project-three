export default class Player {
    constructor(turn, handState) {
        this.hand = handState.hand
        this.lookUp = handState.lookUp
        this.lookDown = handState.lookDown
        this.turn = turn
        this.inTurn = false
    }

    makeCardsObjects(scene, types) {
        let hand = this.hand
        let lookUp = this.lookUp;
        let lookDown = this.lookDown;

        let i = 0;
        for(const cardIndex in hand) {
            let card = hand[cardIndex]; 
            if(card.value >= 0) {
                let texture = types[card.type];
                card.makeCardObject(scene, 330 + (i * 70), 600, texture, true, hand[cardIndex].value);
            }
            else {
                card.makeCardObject(scene, 330 + (i * 70), 600, "blue-joker", true);
            }
            i++;
        }

        i = 0;
        for(const cardIndex in lookDown) {
            let card = lookDown[cardIndex]; 
            card.makeCardObject(scene, 330 + (i * 70), 500, "blue-card-back", false);
            i++;
        }

        i = 0;
        for(const cardIndex in lookUp) {
            let card = lookUp[cardIndex]; 
            if(card.value >= 0) {
                let texture = types[card.type];
                card.makeCardObject(scene, 330 + (i * 70), 480, texture, false, lookUp[cardIndex].value);
            }
            else {
                card.makeCardObject(scene, 330 + (i * 70), 480, "blue-joker", false);
            }
            i++;
        }
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