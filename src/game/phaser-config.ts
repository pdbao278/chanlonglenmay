import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../core/game-rules';
import { PlayScene } from './scenes/PlayScene';

export function createPhaserGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.CANVAS,
    parent,
    width: GAME_CONSTANTS.WORLD_WIDTH,
    height: GAME_CONSTANTS.WORLD_HEIGHT,
    backgroundColor: '#0e0a1a',
    antialias: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_CONSTANTS.WORLD_WIDTH,
      height: GAME_CONSTANTS.WORLD_HEIGHT,
    },
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
    scene: [PlayScene],
  };

  return new Phaser.Game(config);
}
