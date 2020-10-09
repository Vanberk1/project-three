import Card from "./Card";

export default class Opponent {
    constructor(turn, handState) {
        this.turn = turn;
        this.hand = handState.hand;
        this.lookDown = handState.lookDown;
        this.lookUp = handState.lookUp;
    }

    makeCardsObjects(scene, types, position) {
        this.position = position;

        let hand = this.hand
        let lookUp = this.lookUp;
        let lookDown = this.lookDown;
        let x;
        let y;
        let angle;

        this.gameWidth = scene.canvas.width;
        this.gameHeight = scene.canvas.height;
        let cardCount = Object.keys(hand).length;

        let i = 0;
        for(const cardIndex in hand) {
            let card = hand[cardIndex]; 
            switch(this.position) {
                case "top":
                    x = this.gameWidth / 2 - (cardCount * 33 * 2) / 2 + 33 + (i * 70);
                    y = 70;
                    angle = 180;
                    break;
                case "right":
                    x = this.gameWidth - 70;
                    y = this.gameHeight / 2 - (cardCount * 33 * 2) / 2 + 33 + (i * 70);
                    angle = 90;
                    break;
                case "left":
                    x = 70;
                    y = this.gameHeight / 2 - (cardCount * 33 * 2) / 2 + 33 + (i * 70);
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
            switch(this.position) {
                case "top":
                    x = this.gameWidth / 2 - (cardCount * 33 * 2) / 2 + 33 + (i * 70);
                    y = 170;
                    angle = 180;
                    break;
                case "right":
                    x = this.gameWidth - 170;
                    y = this.gameHeight / 2 - (cardCount * 33 * 2) / 2 + 33 + (i * 70);
                    angle = 90; 
                    break;
                case "left":
                    x = 170;
                    y = this.gameHeight / 2 - (cardCount * 33 * 2) / 2 + 33 + (i * 70);
                    angle = -90;
                    break;
            }
            console.log(this.position);
            card.makeCardObject(scene, x, y, "blue-card-back", false);
            card.setAngle(angle);
            i++;
        }

        i = 0;
        for(const cardIndex in lookUp) {
            let card = lookUp[cardIndex]; 
            switch(this.position) {
                case "top":
                    x = this.gameWidth / 2 - (cardCount * 33 * 2) / 2 + 33 + (i * 70);
                    y = 190;
                    angle = 180;
                    break;
                case "right":
                    x = this.gameWidth - 190;
                    y = this.gameHeight / 2 - (cardCount * 33 * 2) / 2 + 33 + (i * 70);
                    angle = 90;
                    break;
                case "left":
                    x = 190;
                    y = this.gameHeight / 2 - (cardCount * 33 * 2) / 2 + 33 + (i * 70);
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

    addCardToHand(scene, cardData) {
        console.log(this.hand);
        this.hand[cardData.index] = new Card(cardData.index, false);
        let newCard = this.hand[cardData.index];
        newCard.makeCardObject(scene, this.gameWidth / 2 + 100, this.gameHeight / 2, "red-card-back", false);
        this.repositionHand();
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

        this.repositionHand();
    }

    repositionHand() {
        let hand = this.hand;
        console.log(this.hand);

        let cardCount = Object.keys(hand).length;

        let i = 0;
        for(const cardIndex in hand) {
            let card = hand[cardIndex].cardObject;
            switch(this.position) {
                case "top":
                    card.x = this.gameWidth / 2 - (cardCount * 33 * 2) / 2 + 33 + (i * 70);
                    card.y = 70;
                    card.angle = 180;
                    break;
                case "right":
                    card.x = this.gameWidth - 70;
                    card.y = this.gameHeight / 2 - (cardCount * 33 * 2) / 2 + 33 + (i * 70);
                    card.angle = 90;
                    break;
                case "left":
                    card.x = 70;
                    card.y = this.gameHeight / 2 - (cardCount * 33 * 2) / 2 + 33 + (i * 70);
                    card.angle = -90;
                    break;
            }
            i++;
        }
    }

    cardsInHand() {
        return Obejct.keys(this.hand).length;
    }
}