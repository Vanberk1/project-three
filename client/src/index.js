import Phaser from "phaser";
import InputTextPlugin from 'phaser3-rex-plugins/plugins/inputtext-plugin.js';
import Game from "./game/game";

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scene: [
    Game
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

