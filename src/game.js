import { Game } from "phaser";

import BootScene from './scenes/BootScene'
import BedroomScene from './scenes/BedroomScene'
import KitchenScene from './scenes/KitchenScene'
import HouseScene from './scenes/HouseScene'
import LivingRoomScene from './scenes/LivingRoomScene.js';
import HallwayScene from './scenes/HallwayScene.js';  
import RoomMasterScene from './scenes/RoomMasterScene.js';
import RoomChildScene from './scenes/RoomChildScene.js'; 
import LavaGameScene from './scenes/LavaGameScene.js';
import PuzzyRoomScene from './scenes/PuzzyRoomScene.js';



const config = {
  pixelArt: true,
  type: Phaser.AUTO,
  parent: "phaser-container",
  width: 950,
  height: 540,
  backgroundColor: "#000000",
  pixelArt: true,
  roundPixel: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    max: {
      width: 800,
      height: 600,
    },
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: true
    }
  },
  scene: [
    BootScene,
    BedroomScene,
    KitchenScene, 
    HouseScene,
    LivingRoomScene,
    HallwayScene,
    RoomMasterScene,
    RoomChildScene,
    LavaGameScene,
    PuzzyRoomScene
  ]
};

new Game(config);