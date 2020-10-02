export default class Opponent {
    constructor(turn, handState) {
        this.turn = turn;
        this.hand = handState.hand;
        this.lookDown = handState.lookDown;
        this.lookUp = handState.lookUp;
    }

    makeCardsObjects(scene, types, position) {
        let hand = this.hand
        let lookUp = this.lookUp;
        let lookDown = this.lookDown;
        let x;
        let y;
        let angle;

        let i = 0;
        for(const cardIndex in hand) {
            let card = hand[cardIndex]; 
            switch(position) {
                case "top":
                    x = 330 + (i * 70);
                    y = 0;
                    angle = 180;
                    break;
                case "right":
                    x = 800;
                    y = 200 + (i * 70);
                    angle = 90;
                    break;
                case "left":
                    x = 0;
                    y = 200 + (i * 70);
                    angle = -90;
                    break;
            }
            card.makeCardObject(scene, x, y, "red-card-back", false);
            card.setAngle(angle);
            i++;
        }

        i = 0;
        for(const cardIndex in lookDown) {
            let card = lookDown[cardIndex]; 
            switch(position) {
                case "top":
                    x = 330 + (i * 70);
                    y = 100;
                    angle = 180;
                    break;
                case "right":
                    x = 700;
                    y = 200 + (i * 70);
                    angle = 90; 
                    break;
                case "left":
                    x = 100;
                    y = 200 + (i * 70);
                    angle = -90;
                    break;
            }
            console.log(position);
            card.makeCardObject(scene, x, y, "blue-card-back", false);
            card.setAngle(angle);
            i++;
        }

        i = 0;
        for(const cardIndex in lookUp) {
            let card = lookUp[cardIndex]; 
            switch(position) {
                case "top":
                    x = 330 + (i * 70);
                    y = 120;
                    angle = 180;
                    break;
                case "right":
                    x = 680;
                    y = 200 + (i * 70);
                    angle = 90;
                    break;
                case "left":
                    x = 120;
                    y = 200 + (i * 70);
                    angle = -90;
                    break;
            }
            if(card.value >= 0) {
                let texture = types[card.type];
                card.makeCardObject(scene, x, y, texture, false, lookUp[cardIndex].value);
            }
            else {
                card.makeCardObject(scene, x, y, "blue-joker", false);
            }
            card.setAngle(angle);
            i++;
        }
    }

    dropCard(index, from) {
        let cards;
        if(from === "hand") {
            cards = this.hand;
        }
        else if(from === "lookUp") {
            cards = this.lookUp;
        }
        else if(from === "lookDown") {
            cards = this.lookDown;
        }

        for(const cardIndex in cards) {
            if(index == cardIndex) {
                console.log(cards[cardIndex]);
                cards[cardIndex].cardObject.destroy();
                delete cards[cardIndex];
            }
        }
    }

    pickCard() {
        ++this.handCount;
    }
}