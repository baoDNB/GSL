import { Game } from "phaser";

import BootScene from './scenes/BootScene'
import KitchenScene from './scenes/KitchenScene'
import HouseScene from './scenes/HouseScene'
import LivingRoomScene from './scenes/LivingRoomScene.js';
import HallwayScene from './scenes/HallwayScene.js';
import RoomMasterScene from './scenes/RoomMasterScene.js';
import RoomChildScene from './scenes/RoomChildScene.js';
import LavaGameScene from './ScenesGame/LavaGameScene.js';
import PuzzyRoomScene from './ScenesGame/PuzzyRoomScene.js';
import MemoryGameScene from "./ScenesGame/MemoryGameScene.js";
import RoomSecretScene from "./scenes/RoomSecretScene.js";
import { initVirtualJoypad } from "./assets/VirtualJoypad.js";
import UIScene from "./assets/UIScene.js";
import Phaser from 'phaser';

// Khởi tạo phím ảo lắng nghe sự kiện từ HTML
initVirtualJoypad();

const config = {
  type: Phaser.AUTO,
  parent: "app", // THAY ĐỔI QUAN TRỌNG: Trỏ đúng vào id="app" của màn hình máy game trong HTML
  
  // LỜI KHUYÊN: Màn hình retro console thường có tỷ lệ 4:3 (Ví dụ: 640x480 hoặc 400x300)
  // Bạn có thể giữ 950x540 nếu game bạn bắt buộc phải rộng như vậy.
  width: 950, 
  height: 540,
  
  backgroundColor: "#000000",
  pixelArt: true,
  roundPixel: false,
  scale: {
    mode: Phaser.Scale.FIT, // FIT giúp game tự động thu nhỏ vừa với khung #app
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Bỏ max width/height nếu bạn muốn nó tự do co giãn theo vỏ máy CSS
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false  // Đổi thành false khi làm xong để ẩn viền đỏ vật lý
    }
  },
  scene: [
    BootScene,
    KitchenScene,
    HouseScene,
    LivingRoomScene,
    HallwayScene,
    RoomMasterScene,
    RoomChildScene,
    LavaGameScene,
    PuzzyRoomScene,
    MemoryGameScene,
    RoomSecretScene,
    UIScene
  ]
};

new Game(config);