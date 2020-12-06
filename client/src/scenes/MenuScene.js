import io from 'socket.io-client';

import heartSheet from "../assets/heart-sheet.png";
import clubSheet from "../assets/club-sheet.png";
import diamondSheet from "../assets/diamond-sheet.png";
import spadeSheet from "../assets/spade-sheet.png";
import blueCard from "../assets/blue-card-back.png";
import redCard from "../assets/red-card-back.png";
import blueJoker from "../assets/blue-joker.png";
import redJoker from "../assets/red-joker.png";
import logo from "../assets/logo.png";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({
            key: "menu"
        });
    }

    init() {
        this.socket = io.connect('http://localhost:3000')
        this.registry.set('socket', this.socket);
    }

    preload() {
        this.load.spritesheet("heart", heartSheet, { frameWidth: 35, frameHeight: 47 });
        this.load.spritesheet("club", clubSheet, { frameWidth: 35, frameHeight: 47 });
        this.load.spritesheet("diamond", diamondSheet, { frameWidth: 35, frameHeight: 47 });
        this.load.spritesheet("spade", spadeSheet, { frameWidth: 35, frameHeight: 47 });
        this.load.image("blue-card-back", blueCard);
        this.load.image("red-card-back", redCard);
        this.load.image("blue-joker", blueJoker);
        this.load.image("red-joker", redJoker);
        this.load.image("logo", logo);
        this.canvas = this.sys.game.canvas;
    }

    create() {
        this.cameras.main.setBackgroundColor("#25282D");

        this.logoIMG = this.add.image(this.canvas.width / 2, 200, "logo");

        let nameInputConfig = {
            align: "left",
            placeholder: "Nombre se usuario",
            fontSize: "40px",
            border: 1,
            borderColor: 'white',
        };
        let nameInputX = this.canvas.width / 2;
        let nameInputY = 450;
        this.nameInput = this.add.rexInputText(nameInputX, nameInputY, 600, 100, nameInputConfig)

        let inputConfig = {
            align: "left",
            placeholder: "Código de la partida",
            fontSize: "40px",
            border: 1,
            borderColor: 'white',
        };
        let sessionInputX = this.canvas.width / 2;
        let sessionInputY = 600;
        this.sessionInput = this.add.rexInputText(sessionInputX, sessionInputY, 600, 100, inputConfig);

        this.createGameButton = this.add.text(230, 700, ['Crear partida']).setFontSize(40).setFontFamily('Trebuchet MS').setColor('#ffffff').setInteractive();
        this.createGameButton.on('pointerdown', () => {
            if(this.nameInput.text != "") {
                let username = this.nameInput.text;
                this.scene.start('lobby', {
                    username: username
                });
            }
        });
        
        this.joinGameButton = this.add.text(650, 700, ['Unirse a una partida']).setFontSize(40).setFontFamily('Trebuchet MS').setColor('#ffffff').setInteractive();
        this.joinGameButton.on('pointerdown', () => {
            console.log(this.sessionInput.text, this.nameInput.text);
            if(this.sessionInput.text != "" && this.nameInput.text != "") {
                let username = this.nameInput.text;
                let sessionId = this.sessionInput.text;
                this.scene.start('lobby', { username: username, sessionId: sessionId });
            }
        });
    }
}