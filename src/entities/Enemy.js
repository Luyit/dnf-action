import Phaser from 'phaser';
import { ENEMY_TYPES, LANE_LIST } from '../config/GameConfig.js';

/**
 * 敌人实体
 * 具有巡逻、追逐、攻击三种 AI 状态
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} lane 通道索引 0/1/2
   * @param {string} type - 'BASIC' | 'HEAVY' | 'FAST'
   */
  constructor(scene, x, lane, type = 'BASIC') {
    const cfg = ENEMY_TYPES[type];
    const texKey = `enemy_${type.toLowerCase()}`;
    const y = LANE_LIST[lane];

    super(scene, x, y, texKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 配置
    this.enemyType = type;
    this.enemyConfig = cfg;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.lane = lane;

    // AI 状态：'idle' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead'
    this.aiState = 'patrol';
    this.attackCooldown = 0;
    this.patrolDir = 1; // 巡逻方向
    this.patrolTimer = 0;
    this.hurtTimer = 0;
    this.alive = true;

    // 出生向左看
    this.setFlipX(true);

    // 碰撞体
    this.body.setSize(cfg.width * 0.6, cfg.height * 0.7);
    this.setOrigin(0.5, 1);

    // 出生特效
    this.setAlpha(0);
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 300,
    });
  }

  /**
   * 受到伤害
   */
  takeDamage(amount, attackerX) {
    if (!this.alive) return;

    this.hp -= amount;

    // 受伤反馈
    this.aiState = 'hurt';
    this.hurtTimer = 200;
    this.setTint(0xff4444);

    // 击退
    const knockbackDir = this.x > attackerX ? 1 : -1;
    this.setVelocityX(knockbackDir * 150);
    this.setVelocityY(-30);

    // 伤害数字
    this.showDamageNumber(amount);

    // 命中特效
    const hitFx = this.scene.add.image(this.x, this.y - 20, 'hit_effect');
    hitFx.setDepth(12);
    this.scene.tweens.add({
      targets: hitFx,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 300,
      onComplete: () => hitFx.destroy(),
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  /**
   * 显示伤害数字
   */
  showDamageNumber(amount) {
    const txt = this.scene.add.text(this.x, this.y - 40, `-${amount}`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);

    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  /**
   * 死亡
   */
  die() {
    if (!this.alive) return;
    this.alive = false;
    this.aiState = 'dead';
    this.body.enable = false;

    this.setTint(0x555555);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.scene.combatSystem.enemyDefeated(this);
        this.destroy();
      },
    });
  }

  /**
   * AI 更新
   */
  update(time, delta) {
    if (!this.alive || !this.body) return;

    const player = this.scene.player;
    if (!player || !player.alive) {
      // 玩家死亡后停止移动
      this.setVelocityX(0);
      return;
    }

    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const cfg = this.enemyConfig;

    // 受伤状态处理
    if (this.aiState === 'hurt') {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.clearTint();
        this.aiState = 'chase';
      }
      // 受伤时不执行 AI
      if (this.hurtTimer > 100) return;
    }

    // 攻击冷却
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // 朝向玩家
    if (player.x < this.x) {
      this.setFlipX(true);
    } else {
      this.setFlipX(false);
    }

    // 状态机
    switch (this.aiState) {
      case 'patrol':
        this.doPatrol(delta);
        if (distToPlayer < cfg.chaseRange) {
          this.aiState = 'chase';
        }
        break;

      case 'chase':
        this.doChase(player, delta);
        if (distToPlayer < cfg.attackRange && this.attackCooldown <= 0) {
          this.aiState = 'attack';
          this.doAttack(player);
        } else if (distToPlayer > cfg.chaseRange * 1.5) {
          // 玩家远离，回到巡逻
          this.aiState = 'patrol';
        }
        break;

      case 'attack':
        // 攻击动作完成后回到追逐
        if (distToPlayer > cfg.attackRange) {
          this.aiState = 'chase';
        }
        break;
    }

    // 超出屏幕销毁
    if (this.x < -100) {
      this.destroy();
    }
  }

  /**
   * 巡逻行为
   */
  doPatrol(delta) {
    this.patrolTimer += delta;
    if (this.patrolTimer > 2000) {
      this.patrolTimer = 0;
      this.patrolDir *= -1;
    }
    this.setVelocityX(this.patrolDir * this.enemyConfig.speed * 0.4);
  }

  /**
   * 追逐玩家
   */
  doChase(player) {
    const cfg = this.enemyConfig;
    const dir = player.x < this.x ? -1 : 1;
    this.setVelocityX(dir * cfg.speed);

    // 尝试对齐玩家通道
    if (player.y < this.y - 30) {
      this.setVelocityY(-80);
    } else if (player.y > this.y + 30) {
      this.setVelocityY(80);
    } else {
      this.setVelocityY(0);
    }
  }

  /**
   * 攻击玩家
   */
  doAttack(player) {
    this.attackCooldown = this.enemyConfig.attackCooldown;
    this.setVelocityX(0);

    // 将伤害传递给战斗系统
    this.scene.combatSystem.enemyAttack(this, player);
    this.aiState = 'chase';
  }
}
