export default class Player {
    constructor(scene, id) {
        this.scene = scene;

        this.id = id;

        this.hand = {
            hand: [],
            lookUp: [],
            lookDown: []
        };
    }

    setFullHand(hand) {
        this.hand = hand;
    }

    addCardToHand(card) {
        this.hand.hand.push(card);
    }

    addCardToLookUp(card) {
        this.hand.lookUp.push(card);
    }

    addCardToLookDown(card) {
        this.hand.lookDown.push(card);
    }
}