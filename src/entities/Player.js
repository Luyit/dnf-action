import Phaser from 'phaser';
import {
  PLAYER_CONFIG,
  LANES,
  LANE_LIST,
  GAME_WIDTH,
  GAME_HEIGHT,
} from '../config/GameConfig.js';

/**
 * 玩家角色
 * 横版动作游戏中的玩家控制角色
 * 支持三线切换移动、攻击、受伤状态
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(32, 48);
    this.body.setOffset(12, 16);
    this.setDepth(10);

    // 状态
    this.hp = PLAYER_CONFIG.MAX_HP;
    this.maxHp = PLAYER_CONFIG.MAX_HP;
    this.currentLane = 1; // 0=TOP, 1=MIDDLE, 2=BOTTOM
    this.isAttacking = false;
    this.isInvincible = false;
    this.attackCooldownTimer = 0;
    this.combo = 0;
    this.facingRight = true;
    this.alive = true;

    // 目标通道 Y（用于平滑移动）
    this.targetLaneY = LANES.MIDDLE;
    this.laneChangeSpeed = 6; // 通道切换平滑系数

    this.setOrigin(0.5, 1);
  }

  /**
   * 移动输入处理
   * @param {number} dirX - 水平方向 (-1左, 0, 1右)
   * @param {number} dirY - 垂直方向 (-1上, 0, 1下)
   */
  handleMovement(dirX, dirY) {
    if (!this.alive || this.isAttacking) return;

    // 水平移动
    this.setVelocityX(dirX * PLAYER_CONFIG.SPEED);

    // 翻转朝向
    if (dirX > 0.1) {
      this.setFlipX(false);
      this.facingRight = true;
    } else if (dirX < -0.1) {
      this.setFlipX(true);
      this.facingRight = false;
    }

    // 垂直通道切换
    if (dirY < -0.3 && this.currentLane > 0) {
      this.currentLane--;
      this.targetLaneY = LANE_LIST[this.currentLane];
    } else if (dirY > 0.3 && this.currentLane < 2) {
      this.currentLane++;
      this.targetLaneY = LANE_LIST[this.currentLane];
    }
  }

  /**
   * 攻击
   */
  attack() {
    if (!this.alive || this.isAttacking) return;
    if (this.attackCooldownTimer > 0) return;

    this.isAttacking = true;
    this.attackCooldownTimer = PLAYER_CONFIG.ATTACK_COOLDOWN;

    // 切换到攻击贴图
    this.setTexture('player_attack');
    if (!this.facingRight) {
      this.setFlipX(true);
    }

    // 攻击范围检测（通过场景的 combatSystem）
    const attackX = this.facingRight
      ? this.x + PLAYER_CONFIG.ATTACK_RANGE / 2
      : this.x - PLAYER_CONFIG.ATTACK_RANGE / 2;

    this.scene.combatSystem.playerAttack(attackX, this.y, PLAYER_CONFIG.ATTACK_RANGE);

    // 攻击特效
    this.createSlashEffect(attackX, this.y - 20);

    // 攻击结束回调
    this.scene.time.delayedCall(250, () => {
      if (!this.alive) return;
      this.isAttacking = false;
      this.setTexture('player_idle');
      if (!this.facingRight) {
        this.setFlipX(true);
      }
    });
  }

  /**
   * 创建攻击刀光特效
   */
  createSlashEffect(x, y) {
    const slash = this.scene.add.image(x, y, 'slash_effect');
    slash.setOrigin(0.5);
    if (!this.facingRight) slash.setFlipX(true);
    slash.setDepth(11);

    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      onComplete: () => slash.destroy(),
    });
  }

  /**
   * 受到伤害
   */
  takeDamage(amount, knockbackX) {
    if (!this.alive || this.isInvincible) return;

    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;

    // 受伤闪烁
    this.isInvincible = true;
    this.setTexture('player_hurt');

    // 击退
    this.setVelocityX(knockbackX);
    this.setVelocityY(-50);

    // 闪烁效果
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.3, to: 1 },
      duration: 100,
      repeat: 4,
      onComplete: () => {
        if (this.alive) {
          this.setTexture('player_idle');
          if (!this.facingRight) this.setFlipX(true);
        }
      },
    });

    // 无敌时间结束
    this.scene.time.delayedCall(PLAYER_CONFIG.INVINCIBLE_TIME, () => {
      this.isInvincible = false;
      if (this.alive) {
        this.alpha = 1;
        this.setTexture('player_idle');
        if (!this.facingRight) this.setFlipX(true);
      }
    });

    // 屏幕震动
    this.scene.cameras.main.shake(100, 0.005);

    // 检查死亡
    if (this.hp <= 0) {
      this.die();
    }

    // 重置连击
    this.combo = 0;
  }

  /**
   * 玩家死亡
   */
  die() {
    this.alive = false;
    this.setVelocityX(0);
    this.setVelocityY(0);
    this.setTint(0x888888);

    // 死亡动画
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y + 30,
      duration: 800,
      onComplete: () => {
        this.scene.onPlayerDeath();
      },
    });
  }

  update(time, delta) {
    if (!this.alive) return;

    // 冷却计时
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= delta;
    }

    // 平滑移动到目标通道
    this.y += (this.targetLaneY - this.y) * 0.12;

    // 如果没有移动输入，减速
    if (!this.isAttacking) {
      if (Math.abs(this.body.velocity.x) < 5) {
        this.setVelocityX(0);
      }
    }
  }
}
