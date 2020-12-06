export default class LobbyScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'lobby'
        });
    }

    init(data) {
        this.socket = this.registry.get('socket');
        this.clientId = this.socket.id;
        this.username = data.username;
        // console.log(data);  
        
        if(!data.sessionId) {
            this.socket.emit('createLobby', {
                clientId: this.clientId,
                clientName: this.username
            });
        }
        else {
            this.socket.emit('joinLobby', {
                sessionId: data.sessionId,
                clientId: this.clientId,
                clientName: this.username
            });
        }
    }

    preload() {

    }

    create() {
        this.cameras.main.setBackgroundColor("#25282D");

        this.socket.on('createLobby', data => {
            this.session = data.session;
            this.createLobby();
        });

        this.socket.on('joinLobby', data => {
            this.session = data.session;
            this.createLobby();
        });

        this.socket.on('startGame', data => {
            this.scene.start('game', {
                session: this.session, 
                game: data.game
            });
        });
    }

    createLobby() {
        // console.log(this.clientId);
        // console.log(this.session);
        if(this.clientId == this.session.hostId) {
            this.dealText = this.add.text(50, 50, ['Empezar partida']).setFontSize(32).setFontFamily('Trebuchet MS').setColor('#ffffff').setInteractive();
            this.dealText.on('pointerdown', () => {
                this.socket.emit('startGame', { sessionId: this.session.sessionId });
            });
        }
        
    
        this.drawClientsNames();

        let sessionIdText = "Código partida: " + this.session.sessionId;
        let sessionIdTextElement = document.createElement("p");
        sessionIdTextElement.innerText = sessionIdText;
        sessionIdTextElement.style.color = 'white'; 
        sessionIdTextElement.style.fontSize = '24px'; 
        sessionIdTextElement.style.fontFamily = 'Trebuchet MS'; 
        this.gameIdLabel = this.add.dom(300, 500, sessionIdTextElement);
    }

    drawClientsNames() {
        this.clientsNames = [];

        let clients = this.session.clients;
        let i = 0;
        for(const id in clients) {
            let clientName = clients[id].name;
            this.clientsNames.push(this.add.text(350, 50 + (i * 25), [clientName]).setFontSize(24).setFontFamily('Trebuchet MS').setColor('#ffffff'));
            i++
        } 
    }
}