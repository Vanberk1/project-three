export default class Card {
    constructor(scene) {
       this.scene = scene; 
    }

    init(x, y, sprite, draggable) {
        let card = this.scene.add.image(x, y, sprite).setScale(3.0, 3.0).setInteractive();
        if(draggable)
            this.scene.input.setDraggable(card);
        return card;
    } 
}