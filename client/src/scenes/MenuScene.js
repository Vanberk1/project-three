// import  SocketIO  from '../sockets/SocketIO';
import io from 'socket.io-client';

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

        console.log(this.socket);
    }

    preload() {
        this.load.image("logo", logo);
        this.canvas = this.sys.game.canvas;
    }

    create() {
        this.socket.on('createLobby', data => {
            if(this.scene.isActive('menu')) {
                let session = data.session 
                console.log(session);
                this.scene.start('lobby', {
                    sessionId: session.sessionId,
                    hostId: session.hostId, 
                    clients: session.clients 
                });
            }
        });

        this.socket.on('joinLobby', data => {
            if(this.scene.isActive('menu')) {
                let session = data.session;
                this.scene.start('lobby', {
                    sessionId: session.sessionId, 
                    hostId: session.hostId, 
                    clients: session.clients 
                });
            }
        });

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
                // this.socket.emitCreateLobby(username)
                console.log(this.socket.id);
                let payLoad = {
                    clientId: this.socket.id,
                    clientName: username
                }
                console.log(payLoad);
                this.socket.emit('createLobby', payLoad);
            }
        });
        
        this.joinGameButton = this.add.text(650, 700, ['Unirse a una partida']).setFontSize(40).setFontFamily('Trebuchet MS').setColor('#ffffff').setInteractive();
        this.joinGameButton.on('pointerdown', () => {
            console.log(this.sessionInput.text, this.nameInput.text);
            if(this.sessionInput.text != "" && this.nameInput.text != "") {
                let username = this.nameInput.text;
                let sessionId = this.sessionInput.text;
                // this.socket.emitJoinLobby(username, sessionId);
                let payLoad = {
                    sessionId: sessionId,
                    clientId: this.socket.id,
                    clientName: username
                }
                this.socket.emit('joinLobby', payLoad);
            }
        });
    }
}