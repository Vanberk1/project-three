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

        this.sortHand();
    }

    makeCardsObjects(scene) {
        let hand = this.hand
        let lookUp = this.lookUp;
        let lookDown = this.lookDown;

        this.gameWidth = scene.canvas.width;
        this.gameHeight = scene.canvas.height;
        let handCardsCant = Object.keys(hand).length;
        let x = this.gameWidth / 2 - (handCardsCant * 33 * 2) / 2 + 33;
        let y = this.gameHeight - 70;

        let i = 0;
        this.handDisplayOrder.forEach(cardIndex =>  {
            let card = hand[cardIndex]; 
            card.makeCardObject(scene, x + (i * 70), y, true);
            i++;
        });

        i = 0;
        for(const cardIndex in lookDown) {
            let card = lookDown[cardIndex]; 
            card.makeCardObject(scene, x + (i * 70), y - 100);
            i++;
        }

        i = 0;
        for(const cardIndex in lookUp) {
            let card = lookUp[cardIndex]; 
            card.makeCardObject(scene, x + (i * 70), y - 120);
            i++;
        }

        if(!this.inTurn) {
            this.disableHandInteractions();
        }
    }

    addCardToHand(scene, cardData) {
        let hand = this.hand;
        let newCard = new Card(cardData.index, cardData.card);
        console.log("pick up card:", cardData);
        hand[cardData.index] = newCard;
        this.sortHand();

        newCard.makeCardObject(scene, 0, this.gameHeight - 70, true);

        this.repositionHand();
    }

    sortHand() {
        let hand = this.hand;
        let handDisplayOrder = [];
        let unorderedHand = [];

        for(const index in hand) {
            let card = { index: index, value: hand[index].value };
            unorderedHand.push(card);
        }

        handDisplayOrder = unorderedHand.sort((a, b) => {
            if(a.value == 0 || a.value == -1)
                return 1
            else if(b.value == 0 || b.value == -1)
                return -1
            return a.value - b.value;
        });
        
        this.handDisplayOrder = handDisplayOrder.map(card => { return card.index; });
    }

    repositionHand() {
        let hand = this.hand;
        let handCardsCant = Object.keys(hand).length;

        let x = this.gameWidth / 2 - (handCardsCant * 33 * 2) / 2 + 33;

        let i = 0;
        this.handDisplayOrder.forEach(cardIndex => {
            let card = hand[cardIndex].cardObject;
            card.x = x + (i * 70);
            i++;
        });
    }

    setTurn(turn) {
        this.inTurn = turn
    }

    dropCardFromHand(index) {
        let hand = this.hand;
        this.handDisplayOrder = this.handDisplayOrder.filter(cardIndex => { return cardIndex !== index });
        hand[index].cardObject.destroy();
        delete hand[index];

        this.repositionHand();
    }

    enableHandInteractions() {
        let hand = this.hand;
        for(const index in hand) {
            let card = hand[index];
            card.setInteractive();
        } 
    }

    disableHandInteractions() {
        let hand = this.hand;
        for(const index in hand) {
            let card = hand[index];
            card.disableInteractive();
        } 
    }

}