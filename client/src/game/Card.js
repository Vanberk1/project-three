export default class Card {
    constructor(index, isLookingUp, data) {
        this.index = index;
        this.isLookingUp = isLookingUp;
        if(data) {
            this.type = data.type;
            this.value = data.value;
        }
    }

    makeCardObject(scene, x, y, texture, interactive, frame) {
        if(frame) {
            this.cardObject = scene.add.image(x, y, texture, frame)
        }
        else {
            this.cardObject = scene.add.image(x, y, texture);
        }

        if(interactive) {
            this.cardObject.setInteractive();
            this.makeDraggeable(scene);
        }

        this.cardObject.setScale(2.0);
        this.cardObject.setDataEnabled();
        this.cardObject.data.set("index", this.index);
    }

    makeDraggeable(scene) {
        scene.input.setDraggable(this.cardObject);
        this.cardObject.on("pointerover", () => {
            this.cardObject.y -= 50;
            this.cardObject.setScale(3.0);
            scene.children.bringToTop(this.cardObject);
        });
        
        this.cardObject.on("pointerout", () => {
            this.cardObject.y += 50;
            this.cardObject.setScale(2.0);
        });
    }

    setAngle(angle) {
        this.cardObject.angle = angle;
    }

    turnLookUp() {
        this.isLookingUp = true;
    }

}