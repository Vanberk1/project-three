export default class Card {
    constructor(isLookingUp, index, data) {
        this.isLookingDown = isLookingUp;
        this.index = index;
        if(data) {
            this.type = data.type;
            this.value = data.value;
        }
        this.effect = null;
    }

    turnLookUp() {
        this.isLookingDown = true;
    }

    useEffect(game) {
        if(this.hasEffect()) {
            this.effect.useEffect(game);
        }
    }

    hasEffect() {
        return this.effect != null ? true : false;
    }

    setEffect(effect) {
        if(effect != null) {
            this.effect = effect;
        }
    }

    changePosition(position) {
        this.position = position;
    }
}