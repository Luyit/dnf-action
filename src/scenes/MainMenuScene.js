import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SKILLS } from '../config/GameConfig.js';

/**
 * 主菜单场景 - 选择角色、开始游戏
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  init(data) {
    this.user = data.user || { username: '冒险家', level: 1, exp: 0 };
  }

  create() {
    const W = GAME_WIDTH, H = GAME_HEIGHT, cx = W / 2;
    this.cameras.main.fadeIn(500);

    // 背景
    const bg = this.add.graphics();
    for (let i = 0; i < H / 15; i++) {
      bg.fillStyle(0x1a1a2e + i * 0x000205, 1);
      bg.fillRect(0, i * 15, W, 15);
    }

    // 装饰粒子
    for (let i = 0; i < 20; i++) {
      const p = this.add.circle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.Between(1, 3), 0x6c5ce7, Phaser.Math.FloatBetween(0.2, 0.5));
      this.tweens.add({ targets: p, y: p.y - Phaser.Math.Between(20, 60), alpha: 0, duration: Phaser.Math.Between(2000, 4000), repeat: -1, yoyo: true });
    }

    // 左侧：角色展板
    this._drawCharacterPanel(cx - 200, 100);

    // 右侧：菜单按钮
    this._drawMenuButtons(cx + 50, 180);

    // 顶部信息栏
    this.add.text(cx, 30, `欢迎回来，${this.user.username}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#f39c12', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(cx, 55, `Lv.${this.user.level}  鬼剑士`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#aaa', stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5);

    // 底部版权
    this.add.text(cx, H - 20, 'DNF Mobile Action · 仅供学习交流', {
      fontSize: '10px', fontFamily: 'Arial', color: '#555',
    }).setOrigin(0.5);
  }

  _drawCharacterPanel(x, y) {
    // 角色立绘框
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4); g.fillRoundedRect(x, y, 180, 320, 10);
    g.lineStyle(1, 0xf39c12, 0.5); g.strokeRoundedRect(x, y, 180, 320, 10);

    // 角色名称
    this.add.text(x + 90, y + 15, '鬼剑士', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    // 角色剪影
    const portrait = this.add.graphics();
    portrait.fillStyle(COLORS.PLAYER, 1);
    portrait.fillRoundedRect(x + 50, y + 40, 80, 120, 6);
    portrait.fillStyle(0x87ceeb, 1);
    portrait.fillCircle(x + 90, y + 40, 25);
    // 武器
    portrait.fillStyle(0xbdc3c7, 1);
    portrait.fillRect(x + 110, y + 65, 40, 8);
    portrait.fillStyle(0xf39c12, 1);
    portrait.fillRect(x + 140, y + 60, 15, 18);

    // 属性
    const statsY = y + 180;
    this.add.text(x + 20, statsY, 'HP ████████████ 200', { fontSize: '11px', fontFamily: 'Arial', color: '#e74c3c' });
    this.add.text(x + 20, statsY + 20, 'MP ██████░░░░░░ 100', { fontSize: '11px', fontFamily: 'Arial', color: '#3498db' });
    this.add.text(x + 20, statsY + 40, 'ATK ████████░░░ 20', { fontSize: '11px', fontFamily: 'Arial', color: '#f39c12' });

    // 技能预览
    this.add.text(x + 20, statsY + 70, '技能:', { fontSize: '11px', fontFamily: 'Arial', color: '#aaa' });
    SKILLS.forEach((s, i) => {
      this.add.text(x + 20 + (i % 2) * 80, statsY + 88 + Math.floor(i / 2) * 18, `${s.icon} ${s.name}`, {
        fontSize: '11px', fontFamily: 'Arial', color: '#ddd',
      });
    });
  }

  _drawMenuButtons(cx, y) {
    const buttons = [
      { text: '开始副本', color: 0xf39c12, action: () => this._startGame() },
      { text: '练习模式', color: 0x2ecc71, action: () => this._startGame() },
      { text: '角色信息', color: 0x3498db, action: () => {} },
      { text: '退出登录', color: 0x7f8c8d, action: () => this._logout() },
    ];

    buttons.forEach((btn, i) => {
      const by = y + i * 60;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.4); g.fillRoundedRect(cx - 100, by, 200, 48, 8);
      g.lineStyle(1, btn.color, 0.5); g.strokeRoundedRect(cx - 100, by, 200, 48, 8);

      const txt = this.add.text(cx, by + 14, btn.text, {
        fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
        color: '#ffffff', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);

      const zone = this.add.zone(cx, by + 24, 200, 48).setInteractive();
      zone.on('pointerover', () => {
        g.clear();
        g.fillStyle(btn.color, 0.2); g.fillRoundedRect(cx - 100, by, 200, 48, 8);
        g.lineStyle(2, btn.color, 0.8); g.strokeRoundedRect(cx - 100, by, 200, 48, 8);
        txt.setColor('#ffff00');
      });
      zone.on('pointerout', () => {
        g.clear();
        g.fillStyle(0x000000, 0.4); g.fillRoundedRect(cx - 100, by, 200, 48, 8);
        g.lineStyle(1, btn.color, 0.5); g.strokeRoundedRect(cx - 100, by, 200, 48, 8);
        txt.setColor('#ffffff');
      });
      zone.on('pointerdown', btn.action);
    });
  }

  _startGame() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('GameScene');
    });
  }

  _logout() {
    localStorage.removeItem('dnf_user');
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('LoginScene');
    });
  }
}
