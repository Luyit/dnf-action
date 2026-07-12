import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig.js';

/**
 * 启动场景 - 资源加载
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // 显示加载进度
    const { width, height } = this.cameras.main;
    const barW = 300;
    const barH = 20;
    const barX = (width - barW) / 2;
    const barY = height / 2 + 40;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.BG_DARK, 1);
    bg.fillRect(0, 0, width, height);

    const title = this.add.text(width / 2, height / 2 - 40, 'DNF 动作', {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height / 2 + 5, '横版动作 Demo', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#a29bfe',
    }).setOrigin(0.5);

    // 进度条背景
    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x2c3e50, 1);
    progressBg.fillRect(barX, barY, barW, barH);

    const progressBar = this.add.graphics();

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(COLORS.PLAYER, 1);
      progressBar.fillRect(barX + 2, barY + 2, (barW - 4) * value, barH - 4);
    });

    // 生成必要的贴图纹理（占位图形）
    this.createPlaceholderTextures();
  }

  createPlaceholderTextures() {
    // 玩家纹理
    const playerGfx = this.make.graphics({ add: false });
    // 身体
    playerGfx.fillStyle(COLORS.PLAYER, 1);
    playerGfx.fillRoundedRect(8, 16, 24, 40, 4);
    // 头部
    playerGfx.fillStyle(0x87ceeb, 1);
    playerGfx.fillCircle(20, 12, 10);
    // 武器
    playerGfx.fillStyle(0xbdc3c7, 1);
    playerGfx.fillRect(32, 22, 22, 6);
    playerGfx.fillStyle(0xf39c12, 1);
    playerGfx.fillRect(48, 20, 8, 10);
    // 腿
    playerGfx.fillStyle(0x2c3e50, 1);
    playerGfx.fillRect(12, 56, 8, 8);
    playerGfx.fillRect(20, 56, 8, 8);
    playerGfx.generateTexture('player_idle', 56, 64);
    playerGfx.destroy();

    // 玩家攻击帧
    const atkGfx = this.make.graphics({ add: false });
    atkGfx.fillStyle(COLORS.PLAYER, 1);
    atkGfx.fillRoundedRect(8, 16, 24, 40, 4);
    atkGfx.fillStyle(0x87ceeb, 1);
    atkGfx.fillCircle(20, 12, 10);
    // 武器挥出
    atkGfx.fillStyle(0xbdc3c7, 1);
    atkGfx.fillRect(30, 20, 28, 6);
    atkGfx.fillStyle(0xf39c12, 1);
    atkGfx.fillRect(52, 18, 10, 10);
    // 腿
    atkGfx.fillStyle(0x2c3e50, 1);
    atkGfx.fillRect(12, 56, 8, 8);
    atkGfx.fillRect(20, 56, 8, 8);
    // 攻击特效
    atkGfx.fillStyle(0xffffff, 0.6);
    atkGfx.fillRect(52, 14, 14, 4);
    atkGfx.generateTexture('player_attack', 66, 64);
    atkGfx.destroy();

    // 玩家受伤帧
    const hurtGfx = this.make.graphics({ add: false });
    hurtGfx.fillStyle(0xff4444, 1);
    hurtGfx.fillRoundedRect(8, 16, 24, 40, 4);
    hurtGfx.fillStyle(0x87ceeb, 1);
    hurtGfx.fillCircle(20, 12, 10);
    hurtGfx.fillStyle(0xbdc3c7, 1);
    hurtGfx.fillRect(32, 22, 22, 6);
    hurtGfx.fillStyle(0x2c3e50, 1);
    hurtGfx.fillRect(12, 56, 8, 8);
    hurtGfx.fillRect(20, 56, 8, 8);
    hurtGfx.generateTexture('player_hurt', 56, 64);
    hurtGfx.destroy();

    // 敌人 - 哥布林
    const basicEnemy = this.make.graphics({ add: false });
    basicEnemy.fillStyle(0xe74c3c, 1);
    basicEnemy.fillRoundedRect(4, 14, 28, 30, 3);
    basicEnemy.fillStyle(0x2ecc71, 1);
    basicEnemy.fillCircle(18, 10, 8);
    basicEnemy.fillStyle(0x2c3e50, 1);
    basicEnemy.fillRect(6, 44, 10, 6);
    basicEnemy.fillRect(20, 44, 10, 6);
    basicEnemy.generateTexture('enemy_basic', 36, 50);
    basicEnemy.destroy();

    // 敌人 - 牛头兵
    const heavyEnemy = this.make.graphics({ add: false });
    heavyEnemy.fillStyle(0xe67e22, 1);
    heavyEnemy.fillRoundedRect(4, 12, 40, 48, 4);
    heavyEnemy.fillStyle(0x8B4513, 1);
    heavyEnemy.fillRect(10, 6, 14, 12);
    heavyEnemy.fillRect(24, 6, 14, 12);
    heavyEnemy.fillStyle(0x2c3e50, 1);
    heavyEnemy.fillRect(8, 60, 14, 10);
    heavyEnemy.fillRect(26, 60, 14, 10);
    heavyEnemy.generateTexture('enemy_heavy', 48, 70);
    heavyEnemy.destroy();

    // 敌人 - 猫妖
    const fastEnemy = this.make.graphics({ add: false });
    fastEnemy.fillStyle(0x9b59b6, 1);
    fastEnemy.fillRoundedRect(4, 10, 24, 26, 3);
    fastEnemy.fillStyle(0xe8d5f5, 1);
    fastEnemy.fillCircle(16, 8, 7);
    fastEnemy.fillStyle(0x2c3e50, 1);
    fastEnemy.fillRect(6, 36, 8, 6);
    fastEnemy.fillRect(18, 36, 8, 6);
    fastEnemy.generateTexture('enemy_fast', 32, 42);
    fastEnemy.destroy();

    // 攻击特效
    const slashGfx = this.make.graphics({ add: false });
    slashGfx.lineStyle(3, 0xffffff, 0.9);
    slashGfx.beginPath();
    slashGfx.moveTo(0, 20);
    slashGfx.lineTo(40, 0);
    slashGfx.lineTo(45, 5);
    slashGfx.lineTo(5, 25);
    slashGfx.closePath();
    slashGfx.strokePath();
    slashGfx.fillStyle(0xffeaa7, 0.6);
    slashGfx.fillRect(0, 0, 45, 25);
    slashGfx.generateTexture('slash_effect', 45, 25);
    slashGfx.destroy();

    // 命中特效
    const hitGfx = this.make.graphics({ add: false });
    hitGfx.fillStyle(0xff6b6b, 0.8);
    hitGfx.fillCircle(16, 16, 12);
    hitGfx.fillStyle(0xffeaa7, 0.6);
    hitGfx.fillCircle(16, 16, 6);
    hitGfx.generateTexture('hit_effect', 32, 32);
    hitGfx.destroy();
  }

  create() {
    // 延迟一下让用户看到标题，然后进入游戏
    this.time.delayedCall(800, () => {
      this.scene.start('GameScene');
    });
  }
}
