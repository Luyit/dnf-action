import { ENEMY_TYPES, PLAYER_CONFIG } from '../config/GameConfig.js';

/**
 * 战斗系统
 * 管理攻击判定、伤害计算、连击统计
 */
export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboTimeout = 2000; // 连击超时
    this.totalKills = 0;
    this.totalScore = 0;
  }

  /**
   * 玩家攻击判定
   */
  playerAttack(attackX, attackY, range) {
    const enemies = this.scene.enemies;
    if (!enemies) return;

    let hitAny = false;

    for (const enemy of enemies) {
      if (!enemy || !enemy.alive) continue;

      const dist = Phaser.Math.Distance.Between(attackX, attackY, enemy.x, enemy.y);
      if (dist < range + enemy.enemyConfig.width / 2) {
        enemy.takeDamage(PLAYER_CONFIG.ATTACK_DAMAGE, this.scene.player.x);
        hitAny = true;
      }
    }

    if (hitAny) {
      this.combo++;
      this.comboTimer = this.comboTimeout;
      return true;
    }
    return false;
  }

  /**
   * 敌人攻击玩家
   */
  enemyAttack(enemy, player) {
    if (!player.alive || player.isInvincible) return;

    const knockbackDir = enemy.x > player.x ? -150 : 150;
    player.takeDamage(enemy.enemyConfig.damage, knockbackDir);

    // 攻击特效
    this.scene.cameras.main.shake(120, 0.003);
  }

  /**
   * 敌人被击败
   */
  enemyDefeated(enemy) {
    this.totalKills++;
    const cfg = enemy.enemyConfig;
    this.totalScore += cfg.score || 100;

    // 通知 HUD
    if (this.scene.hud) {
      this.scene.hud.updateKills(this.totalKills);
      this.scene.hud.updateScore(this.totalScore);
    }
  }

  /**
   * 获取当前连击数
   */
  getCombo() {
    return this.combo;
  }

  /**
   * 每帧更新
   */
  update(delta) {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboTimer = 0;
      }
    }
  }
}
