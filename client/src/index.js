import Phaser from "phaser";
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
};


const game = new Phaser.Game(config);

