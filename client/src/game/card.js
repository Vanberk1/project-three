export default class Card {
    constructor(scene) {
       this.scene = scene;
    }

    renderBack(x, y, sprite) {
        let card = this.scene.add.image(x, y, sprite).setScale(2.0, 2.0);
        this.card = card;
        return card;
    }

    renderFront(x, y, cardData, draggable) {
        let card;
        if(cardData.value != -1) {
            let sprite = cardData.type + "-sheet";
            card = this.scene.add.image(x, y, sprite, cardData.value).setScale(2.0, 2.0).setInteractive();
        }
        else {
            let sprite = "blue-joker";
            card = this.scene.add.image(x, y, sprite).setScale(2.0, 2.0).setInteractive();
        }
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