export default class LobbyScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'lobby'
        });
    }

    init(data) {
        this.scene.pause('menu');
        this.socket = this.registry.get('socket');
        this.clientId = this.socket.id;
        this.session = { id: data.sessionId };
        this.session.hostId = data.hostId;
        this.session.clients = data.clients;
    }

    preload() {

    }

    create() {
        this.socket.on('startGame', data => {
            if(this.scene.isActive('lobby')) {
                this.scene.start('game', {
                    sessionId: data.sessionId, 
                    gameId: data.gameId,
                    clients: data.clients,
                    clientState: data.clientState,
                });
            }
        });

        this.socket.on('joinLobby', data => {
            if(this.scene.isActive('lobby')) {
                this.session.id = data.session.sessionId;
                this.session.hostId = data.session.hostId;
                this.session.clients = data.session.clients;
                console.log(this.session);
                this.clientsNames.forEach(clientName => {
                    clientName.destroy();
                });
                this.clientsNames = [];
                this.drawClientsNames();
            }
        });

        this.cameras.main.setBackgroundColor("#25282D");
        
        if(this.clientId == this.session.hostId) {
            this.dealText = this.add.text(50, 50, ['Empezar partida']).setFontSize(32).setFontFamily('Trebuchet MS').setColor('#ffffff').setInteractive();
            this.dealText.on('pointerdown', () => {
                console.log("start game");
                console.log(this.session);
                let payLoad = {
                    sessionId: this.session.id
                };
                this.socket.emit('startGame', payLoad);
            });
        }
        
        this.clientsNames = [];
        this.drawClientsNames();

        let sessionIdText = "Código partida: " + this.session.id;
        let sessionIdTextElement = document.createElement("p");
        sessionIdTextElement.innerText = sessionIdText;
        sessionIdTextElement.style.color = 'white'; 
        sessionIdTextElement.style.fontSize = '24px'; 
        sessionIdTextElement.style.fontFamily = 'Trebuchet MS'; 
        this.gameIdLabel = this.add.dom(300, 500, sessionIdTextElement);
    }

    drawClientsNames() {
        let clients = this.session.clients;
        let i = 0;
        for(const id in clients) {
            let clientName = clients[id].name;
            this.clientsNames.push(this.add.text(350, 50 + (i * 25), [clientName]).setFontSize(24).setFontFamily('Trebuchet MS').setColor('#ffffff'));
            i++
        } 
    }
}