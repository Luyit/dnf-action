import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, LANE_LIST, COLORS, ENEMY_TYPES, WAVE_CONFIG, SKILLS } from '../config/GameConfig.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { GameControls } from '../controls/VirtualJoystick.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { HUD } from '../ui/HUD.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.createBackground();
    this.createGround();

    this.combatSystem = new CombatSystem(this);
    this.enemies = [];
    this.player = new Player(this, 150, LANE_LIST[1]);
    this.controls = new GameControls(this);
    this.hud = new HUD(this);

    this.cameras.main.setBounds(0, 0, 3000, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(100, 60);
    this.physics.world.setBounds(0, 0, 3000, GAME_HEIGHT + 100);

    this.isGameOver = false;
    this.gameTime = 0;
    this.waveTransitionTimer = 0;
    this.isWaveTransition = false;

    // 启动第一波
    this.time.delayedCall(1500, () => this.startWave(1));
    this.hud.showHint('左下轮盘移动 | 右下攻击/跳跃 | 上排技能键', 4000);
  }

  // ── 波次系统 ──
  startWave(num) {
    this.combatSystem.currentWave = num;
    this.combatSystem.waveActive = true;
    this.hud.updateWave(num, WAVE_CONFIG.MAX_WAVES);

    const table = WAVE_CONFIG.WAVE_ENEMY_TABLE[num - 1];
    let totalCount = 0;
    table.forEach(g => { totalCount += g.count; });
    this.combatSystem.waveEnemiesRemaining = totalCount;

    // 显示波次标题
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40,
      num === WAVE_CONFIG.MAX_WAVES ? '⚠ BOSS 登场 !' : `第 ${num} 波`,
      { fontSize: num === WAVE_CONFIG.MAX_WAVES ? '40px' : '36px', fontFamily: 'Arial', fontStyle: 'bold',
        color: num === WAVE_CONFIG.MAX_WAVES ? '#ff4444' : '#f39c12', stroke: '#000', strokeThickness: 6 })
      .setOrigin(0.5).setScrollFactor(0).setDepth(700);
    this.tweens.add({ targets: txt, alpha: 0, y: txt.y - 30, duration: 2000, onComplete: () => txt.destroy() });

    // 分批生成敌人
    const camR = this.cameras.main.scrollX + GAME_WIDTH + 60;
    let delay = 300;
    table.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        this.time.delayedCall(delay, () => {
          if (this.isGameOver) return;
          const lane = Phaser.Math.Between(0, 3);
          const x = camR + i * 50;
          this.spawnEnemy(x, lane, group.type);
        });
        delay += 400;
      }
    });
  }

  onWaveComplete() {
    this.combatSystem.waveActive = false;
    const num = this.combatSystem.currentWave;
    if (num >= WAVE_CONFIG.MAX_WAVES) {
      this.onVictory();
      return;
    }
    this.isWaveTransition = true;
    this.waveTransitionTimer = WAVE_CONFIG.PREP_TIME;
    this.hud.showHint(`第 ${num} 波清除！准备下一波...`, 2000);
  }

  onVictory() {
    this.isGameOver = true;
    const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
    const overlay = this.add.graphics().setScrollFactor(0).setDepth(800);
    overlay.fillStyle(0x000000, 0); overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.tweens.add({ targets: overlay, alpha: 0.7, duration: 1000 });
    this.time.delayedCall(600, () => {
      this.add.text(cx, cy - 50, '副本通关!', { fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: '#f39c12', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(801);
      this.add.text(cx, cy + 10, `击杀: ${this.combatSystem.totalKills}  |  得分: ${this.combatSystem.totalScore}`, { fontSize: '20px', fontFamily: 'Arial', color: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(801);
      const rst = this.add.text(cx, cy + 60, '[ 再次挑战 ]', { fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#2ecc71', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(801).setInteractive();
      rst.on('pointerover', () => rst.setColor('#55efc4'));
      rst.on('pointerout', () => rst.setColor('#2ecc71'));
      rst.on('pointerdown', () => this.scene.restart());
    });
  }

  // ── 背景 ──
  createBackground() {
    const bg = this.add.graphics().setDepth(0);
    for (let i = 0; i < GAME_HEIGHT / 20; i++) {
      const r = Math.floor(26 + (i / (GAME_HEIGHT / 20)) * 10);
      const g = Math.floor(26 + (i / (GAME_HEIGHT / 20)) * 16);
      const b = Math.floor(46 + (i / (GAME_HEIGHT / 20)) * 8);
      bg.fillStyle((r << 16) | (g << 8) | b, 1);
      bg.fillRect(0, i * 20, 3000, 20);
    }
    // 远景
    const far = this.add.graphics().setDepth(1).setScrollFactor(0.2);
    far.fillStyle(0x111122, 0.6);
    for (let i = 0; i < 30; i++) { const bx = i * 120 + Phaser.Math.Between(-20, 20); far.fillRect(bx, 160 - Phaser.Math.Between(60, 140), Phaser.Math.Between(30, 60), Phaser.Math.Between(60, 140)); }
    // 中层
    const mid = this.add.graphics().setDepth(2).setScrollFactor(0.3);
    mid.fillStyle(0x151530, 0.7);
    for (let i = 0; i < 35; i++) { const bx = i * 100 + Phaser.Math.Between(-15, 15); mid.fillRect(bx, 280 - Phaser.Math.Between(80, 180), Phaser.Math.Between(25, 50), Phaser.Math.Between(80, 180)); }
    // 光点
    const win = this.add.graphics().setDepth(3).setScrollFactor(0.4);
    win.fillStyle(0xffd700, 0.35);
    for (let i = 0; i < 50; i++) win.fillRect(Phaser.Math.Between(0, 3000), Phaser.Math.Between(100, 250), 3, 5);
  }

  createGround() {
    const gy = GAME_HEIGHT - 80;
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x1a1a2e, 1); g.fillRect(0, gy, 3000, GAME_HEIGHT - gy);
    g.lineStyle(2, 0x333355, 1); g.lineBetween(0, gy, 3000, gy);
    g.lineStyle(1, 0x222244, 0.4);
    for (let x = 0; x < 3000; x += 60) g.lineBetween(x, gy + 20, x, gy + 40);
  }

  spawnEnemy(x, lane, type = 'BASIC') {
    const enemy = new Enemy(this, x, lane, type);
    this.enemies.push(enemy);
    return enemy;
  }

  onPlayerDeath() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
    const overlay = this.add.graphics().setScrollFactor(0).setDepth(800);
    overlay.fillStyle(0x000000, 0); overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.tweens.add({ targets: overlay, alpha: 0.8, duration: 1200 });
    this.time.delayedCall(800, () => {
      this.add.text(cx, cy - 40, '战斗失败', { fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: '#e74c3c', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(801);
      this.add.text(cx, cy + 20, `击杀: ${this.combatSystem.totalKills} | 得分: ${this.combatSystem.totalScore}`, { fontSize: '18px', fontFamily: 'Arial', color: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(801);
      const rst = this.add.text(cx, cy + 70, '[ 重新挑战 ]', { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#f39c12', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(801).setInteractive();
      rst.on('pointerover', () => rst.setColor('#ffcc00'));
      rst.on('pointerout', () => rst.setColor('#f39c12'));
      rst.on('pointerdown', () => this.scene.restart());
    });
  }

  update(time, delta) {
    if (this.isGameOver) return;
    this.gameTime += delta;

    // ── 波次过渡 ──
    if (this.isWaveTransition) {
      this.waveTransitionTimer -= delta;
      if (this.waveTransitionTimer <= 0) {
        this.isWaveTransition = false;
        this.startWave(this.combatSystem.currentWave + 1);
      }
    }

    // ── 控件输入 ──
    const dir = this.controls.getDirection();
    this.player.handleMovement(dir.x, dir.y);
    if (this.controls.getAttack()) this.player.attack();
    if (this.controls.getJump()) this.player.jump();
    if (this.controls.getDash()) this.player.dash();
    SKILLS.forEach(s => { if (this.controls.getSkillTriggered(s.id)) this.player.useSkill(s.id); });
    this.controls.update(delta);

    // ── 玩家 ──
    this.player.update(time, delta);

    // ── 战斗/敌人 ──
    this.combatSystem.update(delta);
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e && e.active) e.update(time, delta);
      else this.enemies.splice(i, 1);
    }

    // ── HUD ──
    this.hud.update();

    // ── 扩展世界 ──
    if (this.player.x > this.physics.world.bounds.width - 500) {
      const nw = this.physics.world.bounds.width + 1000;
      this.physics.world.setBounds(0, 0, nw, GAME_HEIGHT + 100);
      this.cameras.main.setBounds(0, 0, nw, GAME_HEIGHT);
    }

    if (this.player.y > GAME_HEIGHT + 200) this.player.takeDamage(9999, 0);
  }
}
