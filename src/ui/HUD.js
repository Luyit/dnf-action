import Phaser from 'phaser';
import { GAME_WIDTH, COLORS, PLAYER_CONFIG } from '../config/GameConfig.js';

/**
 * 游戏 HUD
 * 显示血量、连击数、击杀数、分数
 */
export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.kills = 0;
    this.score = 0;

    this.create();
  }

  create() {
    const pad = 16;

    // ---- 左上角：角色状态 ----
    // 等级标签
    this.lvlLabel = this.scene.add.text(pad, pad, 'Lv.1', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#f39c12',
      stroke: '#000',
      strokeThickness: 2,
    }).setDepth(200);

    // 名称
    this.nameLabel = this.scene.add.text(pad + 40, pad, '鬼剑士', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
    }).setDepth(200);

    // 血条背景
    const hpBarX = pad;
    const hpBarY = pad + 24;
    const hpBarW = 180;
    const hpBarH = 14;

    this.hpBarBg = this.scene.add.graphics().setDepth(200);
    this.hpBarBg.fillStyle(COLORS.HEALTH_BG, 0.8);
    this.hpBarBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
    this.hpBarBg.lineStyle(1, 0x555555, 1);
    this.hpBarBg.strokeRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);

    // 血条
    this.hpBar = this.scene.add.graphics().setDepth(201);

    // HP 文字
    this.hpText = this.scene.add.text(hpBarX + hpBarW / 2, hpBarY + hpBarH / 2, '', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(202);

    // 初始绘制血条
    this.updateHP(PLAYER_CONFIG.MAX_HP, PLAYER_CONFIG.MAX_HP);

    // ---- 右上角：击杀和分数 ----
    const rx = GAME_WIDTH - pad;
    this.killLabel = this.scene.add.text(rx, pad, '击杀: 0', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#e74c3c',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(200);

    this.scoreLabel = this.scene.add.text(rx, pad + 20, '分数: 0', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#f39c12',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(200);

    // ---- 连击显示（屏幕中央上方） ----
    this.comboText = this.scene.add.text(GAME_WIDTH / 2, 60, '', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#ff6b6b',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    // ---- 底部操作提示 ----
    this.hintText = this.scene.add.text(GAME_WIDTH / 2, this.scene.cameras.main.height - 10, '', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(200);
  }

  /**
   * 更新血条
   */
  updateHP(hp, maxHp) {
    const hpBarX = 16;
    const hpBarY = 40;
    const hpBarW = 180;
    const hpBarH = 14;
    const ratio = Math.max(0, hp / maxHp);

    this.hpBar.clear();

    // 血量颜色：绿 -> 黄 -> 红
    let color;
    if (ratio > 0.5) {
      color = COLORS.HEALTH_GREEN;
    } else if (ratio > 0.25) {
      color = 0xf1c40f;
    } else {
      color = COLORS.HEALTH_RED;
    }

    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRoundedRect(hpBarX, hpBarY, hpBarW * ratio, hpBarH, 4);

    this.hpText.setText(`${hp} / ${maxHp}`);
  }

  /**
   * 更新连击显示
   */
  updateCombo(combo) {
    if (combo >= 5) {
      this.comboText.setText(`${combo} HITS!`);
      this.comboText.setAlpha(1);
      this.comboText.setScale(1.3);

      // 放大弹跳效果
      this.scene.tweens.add({
        targets: this.comboText,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        ease: 'Back.easeOut',
      });
    } else if (combo <= 0) {
      this.scene.tweens.add({
        targets: this.comboText,
        alpha: 0,
        duration: 200,
      });
    } else {
      this.comboText.setText(`${combo} HITS`);
      this.comboText.setAlpha(0.8);
      this.comboText.setScale(1);
    }
  }

  /**
   * 更新击杀数
   */
  updateKills(kills) {
    this.kills = kills;
    this.killLabel.setText(`击杀: ${kills}`);
  }

  /**
   * 更新分数
   */
  updateScore(score) {
    this.score = score;
    this.scoreLabel.setText(`分数: ${score}`);
  }

  /**
   * 显示提示信息
   */
  showHint(text, duration = 3000) {
    this.hintText.setText(text);
    this.hintText.setAlpha(1);
    this.scene.tweens.add({
      targets: this.hintText,
      alpha: 0,
      delay: duration,
      duration: 500,
    });
  }

  /**
   * 每帧更新
   */
  update() {
    // 连击数渐变
    const combo = this.scene.combatSystem.getCombo();
    this.updateCombo(combo);

    // 更新血条
    const player = this.scene.player;
    if (player) {
      this.updateHP(player.hp, player.maxHp);
    }
  }

  destroy() {
    // 清理所有文本和图形
  }
}
