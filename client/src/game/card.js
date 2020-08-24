export default class Card {
    constructor(scene) {
       this.scene = scene; 
    }

    init(x, y, sprite, draggable) {
        let card = this.scene.add.image(x, y, sprite).setScale(2.0, 2.0).setInteractive();
        if(draggable) {
            this.scene.input.setDraggable(card);
            card.on("pointerover", () => {
                card.y -= 50;
                card.setScale(3.0, 3.0);
                this.scene.children.bringToTop(card);
            });
            
            card.on("pointerout", () => {
                card.y += 50;
                card.setScale(2.0, 2.0);
            });
        }
        this.card = card;
        return card;
    } 
}