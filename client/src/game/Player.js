import Card from "./Card";

const types = {
    0: 'club',
    1: 'diamond',
    2: 'heart',
    3: 'spade',
    4: 'joker'
};

export default class Player {
    constructor(turn, handState) {
        this.hand = handState.hand;
        this.lookUp = handState.lookUp;
        this.lookDown = handState.lookDown;
        this.turn = turn;
        this.inTurn = false;
        this.cardPlayed = false;
        this.canPlay = true;

        this.sortHand();
    }

    makeCardsObjects(scene, types) {
        let hand = this.hand
        let lookUp = this.lookUp;
        let lookDown = this.lookDown;

        this.gameWidth = scene.canvas.width;
        this.gameHeight = scene.canvas.height;
        let cardCount = Object.keys(hand).length;
        let posX = this.gameWidth / 2 - (cardCount * 33 * 2) / 2 + 33;
        let posY = this.gameHeight - 70;

        let i = 0;
        this.displayOrder.forEach(cardIndex =>  {
            let card = hand[cardIndex]; 
            if(card.value >= 0) {
                let texture = types[card.type];
                card.makeCardObject(scene, posX + (i * 70), posY, texture, true, hand[cardIndex].value);
            }
            else {
                card.makeCardObject(scene, posX + (i * 70), posY, "blue-joker", true);
            }
            i++;
        });

        i = 0;
        for(const cardIndex in lookDown) {
            let card = lookDown[cardIndex]; 
            card.makeCardObject(scene, posX + (i * 70), posY - 100, "blue-card-back", false);
            i++;
        }

        i = 0;
        for(const cardIndex in lookUp) {
            let card = lookUp[cardIndex]; 
            if(card.value >= 0) {
                let texture = types[card.type];
                card.makeCardObject(scene, posX + (i * 70), posY - 120, texture, false, lookUp[cardIndex].value);
            }
            else {
                card.makeCardObject(scene, posX + (i * 70), posY - 120, "blue-joker", false);
            }
            i++;
        }

        if(!this.inTurn) {
            this.disableHandInteractions();
        }
    }

    addCardToHand(scene, cardData) {
        let hand = this.hand;
        let newCard = new Card(cardData.index, true, cardData.card);
        hand[cardData.index] = newCard;
        this.sortHand();

        if(newCard.value >= 0) {
            let texture = types[newCard.type];
            newCard.makeCardObject(scene, 0, this.gameHeight - 70, texture, true, newCard.value);
        }
        else {
            newCard.makeCardObject(scene, 0, this.gameHeight - 70, "blue-joker", true);
        }

        this.repositionHand();
    }

    sortHand() {
        let hand = this.hand;
        let displayOrder = [];
        let unorderedHand = [];

        for(const index in hand) {
            let card = { index: index, value: hand[index].value };
            unorderedHand.push(card);
        }

        displayOrder = unorderedHand.sort((a, b) => {
            return a.value - b.value;
        });
        
        this.displayOrder = displayOrder.map(card => { return card.index; });
    }

    repositionHand() {
        let hand = this.hand;
        let cardCount = Object.keys(hand).length;

        let posX = this.gameWidth / 2 - (cardCount * 33 * 2) / 2 + 33;

        let i = 0;
        this.displayOrder.forEach(cardIndex => {
            let card = hand[cardIndex].cardObject;
            card.x = posX + (i * 70);
            i++;
        });
    }

    setTurn(turn) {
        this.inTurn = turn
    }

    dropCardFromHand(index) {
        let hand = this.hand;
        this.displayOrder = this.displayOrder.filter(cardIndex => { return cardIndex !== index });
        delete hand[index];

        this.repositionHand();
    }

    enableHandInteractions() {
        let hand = this.hand;
        
        for(const index in hand) {
            let card = hand[index];
            card.cardObject.setInteractive();
        } 
    }

    disableHandInteractions() {
        let hand = this.hand;
        
        for(const index in hand) {
            let card = hand[index];
            card.cardObject.disableInteractive();
        } 
    }

}