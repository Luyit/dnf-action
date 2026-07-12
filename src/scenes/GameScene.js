import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  LANE_LIST,
  COLORS,
  ENEMY_TYPES,
  WORLD_CONFIG,
} from '../config/GameConfig.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { VirtualJoystick } from '../controls/VirtualJoystick.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { HUD } from '../ui/HUD.js';

/**
 * 主游戏场景
 * DNF手游风格横版动作游戏核心场景
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    // ---- 世界初始化 ----
    this.createBackground();
    this.createGround();

    // ---- 战斗系统 ----
    this.combatSystem = new CombatSystem(this);

    // ---- 玩家 ----
    this.player = new Player(this, 200, LANE_LIST[1]);
    this.player.setDepth(10);

    // ---- 敌人列表 ----
    this.enemies = [];

    // ---- 控件 ----
    this.joystick = new VirtualJoystick(this, 100, GAME_HEIGHT - 170, 72);

    // ---- HUD ----
    this.hud = new HUD(this);

    // ---- 相机 ----
    this.cameras.main.setBounds(0, 0, 2000, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 50);
    this.physics.world.setBounds(0, 0, 2000, GAME_HEIGHT);

    // ---- 敌人出生定时器 ----
    this.spawnTimer = 0;
    this.spawnInterval = WORLD_CONFIG.SPAWN_INTERVAL_MAX;
    this.gameTime = 0;

    // 初始生成几个敌人
    this.spawnEnemy(600, Phaser.Math.Between(0, 2), 'BASIC');
    this.spawnEnemy(750, Phaser.Math.Between(0, 2), 'BASIC');
    this.spawnEnemy(550, Phaser.Math.Between(0, 2), 'BASIC');

    // ---- 游戏状态 ----
    this.isGameOver = false;

    // ---- 操作提示 ----
    this.hud.showHint('摇杆移动 | J键/按钮攻击 | 消灭所有敌人', 4000);

    // 键盘操作提示（如果一段时间内没有移动）
    this.showKeyboardHints = true;
    this.time.delayedCall(3000, () => {
      if (this.showKeyboardHints && this.player.alive) {
        this.hud.showHint('键盘: WASD移动 J键攻击', 3000);
      }
    });
  }

  /**
   * 创建背景
   */
  createBackground() {
    // 天空渐变背景
    const bg = this.add.graphics();
    bg.setDepth(0);

    // 天空渐变色带
    const colors = [
      { y: 0, color: COLORS.BG_DARK },
      { y: 0.3, color: COLORS.BG_MID },
      { y: 0.6, color: COLORS.BG_LIGHT },
      { y: 1, color: 0x0a0a14 },
    ];

    const tileH = 20;
    for (let i = 0; i < GAME_HEIGHT / tileH; i++) {
      const ratio = i / (GAME_HEIGHT / tileH);
      const r = Math.floor(26 + ratio * 10);
      const g = Math.floor(26 + ratio * 16);
      const b = Math.floor(46 + ratio * 8);
      const c = (r << 16) | (g << 8) | b;
      bg.fillStyle(c, 1);
      bg.fillRect(0, i * tileH, 2000, tileH);
    }

    // 远景建筑剪影
    const farBld = this.add.graphics().setDepth(1);
    farBld.fillStyle(0x111122, 0.7);
    farBld.fillRect(0, 80, 2000, 3);
    for (let i = 0; i < 20; i++) {
      const bx = i * 120 + Phaser.Math.Between(-20, 20);
      const bw = Phaser.Math.Between(30, 60);
      const bh = Phaser.Math.Between(60, 140);
      farBld.fillRect(bx, 160 - bh, bw, bh);
    }

    // 中层建筑
    const midBld = this.add.graphics().setDepth(2);
    midBld.fillStyle(0x151530, 0.8);
    for (let i = 0; i < 25; i++) {
      const bx = i * 90 + Phaser.Math.Between(-15, 15);
      const bw = Phaser.Math.Between(25, 50);
      const bh = Phaser.Math.Between(100, 200);
      midBld.fillRect(bx, 280 - bh, bw, bh);
    }

    // 窗户光点
    const windows = this.add.graphics().setDepth(3);
    windows.fillStyle(0xffd700, 0.4);
    for (let i = 0; i < 40; i++) {
      const wx = Phaser.Math.Between(0, 2000);
      const wy = Phaser.Math.Between(100, 250);
      windows.fillRect(wx, wy, 4, 6);
    }
  }

  /**
   * 创建地面
   */
  createGround() {
    const groundY = WORLD_CONFIG.GROUND_Y;

    // 地面主层
    const ground = this.add.graphics().setDepth(5);
    ground.fillStyle(0x1a1a2e, 1);
    ground.fillRect(0, groundY, 2000, GAME_HEIGHT - groundY);

    // 地面线
    ground.lineStyle(2, 0x333355, 1);
    ground.lineBetween(0, groundY, 2000, groundY);

    // 地面纹理线
    ground.lineStyle(1, 0x222244, 0.5);
    for (let x = 0; x < 2000; x += 60) {
      ground.lineBetween(x, groundY + 20, x, groundY + 40);
    }
  }

  /**
   * 生成敌人
   */
  spawnEnemy(x, lane, type = 'BASIC') {
    const cfg = ENEMY_TYPES[type];
    const texKey = `enemy_${type.toLowerCase()}`;
    const enemy = new Enemy(this, x, lane, type);
    this.enemies.push(enemy);
    return enemy;
  }

  /**
   * 生成随机敌人（在屏幕右侧）
   */
  spawnRandomEnemy() {
    const cameraRight = this.cameras.main.scrollX + GAME_WIDTH + 50;
    const lane = Phaser.Math.Between(0, 2);

    // 根据游戏时间增加难度
    let type;
    const roll = Math.random();
    if (this.gameTime > 30000 && roll < 0.25) {
      type = 'HEAVY';
    } else if (this.gameTime > 15000 && roll < 0.5) {
      type = 'FAST';
    } else {
      type = 'BASIC';
    }

    this.spawnEnemy(cameraRight, lane, type);
  }

  /**
   * 玩家死亡回调
   */
  onPlayerDeath() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // 黑幕
    const overlay = this.add.graphics().setDepth(500);
    overlay.fillStyle(0x000000, 0);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.tweens.add({
      targets: overlay,
      alpha: 0.7,
      duration: 1000,
    });

    // Game Over 文字
    this.time.delayedCall(800, () => {
      this.add.text(cx, cy - 40, '战斗失败', {
        fontSize: '48px',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        color: '#e74c3c',
        stroke: '#000',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(501);

      this.add.text(cx, cy + 20, `击杀: ${this.combatSystem.totalKills}  |  分数: ${this.combatSystem.totalScore}`, {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(501);

      // 重新开始按钮
      const restartText = this.add.text(cx, cy + 70, '[ 重新挑战 ]', {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        color: '#f39c12',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(501).setInteractive();

      restartText.on('pointerover', () => restartText.setColor('#ffcc00'));
      restartText.on('pointerout', () => restartText.setColor('#f39c12'));
      restartText.on('pointerdown', () => {
        this.scene.restart();
      });
    });
  }

  /**
   * 更新循环
   */
  update(time, delta) {
    if (this.isGameOver) return;

    // 游戏时间
    this.gameTime += delta;

    // ---- 控件输入 ----
    const dir = this.joystick.getDirection();
    this.player.handleMovement(dir.x, dir.y);

    if (this.joystick.getAttackInput()) {
      this.player.attack();
    }
    this.joystick.update();

    // ---- 玩家更新 ----
    this.player.update(time, delta);

    // ---- 战斗系统 ----
    this.combatSystem.update(delta);

    // ---- 敌人更新 ----
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy && enemy.active) {
        enemy.update(time, delta);
      } else {
        this.enemies.splice(i, 1);
      }
    }

    // ---- 敌人生成 ----
    this.spawnTimer += delta;
    if (this.spawnTimer > this.spawnInterval && this.enemies.length < 8) {
      this.spawnTimer = 0;
      this.spawnRandomEnemy();
      // 随游戏时间加快生成频率
      this.spawnInterval = Math.max(
        WORLD_CONFIG.SPAWN_INTERVAL_MIN,
        WORLD_CONFIG.SPAWN_INTERVAL_MAX - this.gameTime * 0.01
      );
    }

    // ---- HUD 更新 ----
    this.hud.update();

    // ---- 世界边界动态扩展 ----
    if (this.player.x > this.physics.world.bounds.width - 400) {
      const newWidth = this.physics.world.bounds.width + 1000;
      this.physics.world.setBounds(0, 0, newWidth, GAME_HEIGHT);
      this.cameras.main.setBounds(0, 0, newWidth, GAME_HEIGHT);
    }

    // ---- 键盘距离提示开关 ----
    if (Math.abs(this.player.body.velocity.x) > 10 || Math.abs(this.player.body.velocity.y) > 10) {
      this.showKeyboardHints = false;
    }

    // ---- 玩家掉出世界 ----
    if (this.player.y > GAME_HEIGHT + 100) {
      this.player.takeDamage(9999, 0);
    }
  }
}
