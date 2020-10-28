export default class Card {
    constructor(index, data) {
        this.index = index;
        this.isLookingUp = data ? true : false;
        this.type = data ? data.type : null;
        this.value = data ? data.value : null

        this.types = {
            0: 'club',
            1: 'diamond',
            2: 'heart',
            3: 'spade',
            4: 'joker'
        };
    }

    makeCardObject(scene, x, y, interactive) {
        if(this.isLookingUp) {
            if(this.value != -1) {
                let value = this.value == 13 ? 0 : this.value;
                let texture = this.types[this.type];
                this.cardObject = scene.add.image(x, y, texture, value);
            }
            else {
                this.cardObject = scene.add.image(x, y, "blue-joker");
            }
        }
        else {
            this.cardObject = scene.add.image(x, y, "blue-card-back");
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
        this.cardObject.on("pointerdown", () => {
            // this.cardObject.y -= 50;
            this.cardObject.setScale(3.0);
            scene.children.bringToTop(this.cardObject);
        });
        
        this.cardObject.on("pointerup", () => {
            // this.cardObject.y += 50;
            this.cardObject.setScale(2.0);
        });
    }

    setInteractive() {
        this.cardObject.setInteractive();
    }

    disableInteractive() {
        this.cardObject.disableInteractive();
    }

    setAngle(angle) {
        this.cardObject.angle = angle;
    }
}