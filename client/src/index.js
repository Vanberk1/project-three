import Phaser from 'phaser';
import InputTextPlugin from 'phaser3-rex-plugins/plugins/inputtext-plugin.js';
import MenuScene from './scenes/MenuScene';
import LobbyScene from './scenes/LobbyScene';
import GameScene from './scenes/GameScene';

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 1200,
  height: 800,
  scene: [
    MenuScene,
    LobbyScene,
    GameScene
  ],
  pixelArt: true,
  dom: {
      createContainer: true
  },  
  plugins: {
    global: [{
        key: 'rexInputTextPlugin',
        plugin: InputTextPlugin,
        start: true
      },
    ]
  }
};

const game = new Phaser.Game(config);

