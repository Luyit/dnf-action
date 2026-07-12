import Phaser from 'phaser';
import { PLAYER_CONFIG, LANES, LANE_LIST, SKILLS, GAME_WIDTH } from '../config/GameConfig.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_idle');
    scene.add.existing(this); scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.body.setSize(32, 48); this.body.setOffset(12, 16);
    this.setDepth(10); this.setOrigin(0.5, 1);

    this.hp = PLAYER_CONFIG.MAX_HP; this.maxHp = PLAYER_CONFIG.MAX_HP;
    this.mp = PLAYER_CONFIG.MAX_MP; this.maxMp = PLAYER_CONFIG.MAX_MP;
    this.currentLane = 1; this.targetLaneY = LANES.MID_TOP;
    this.isAttacking = false; this.isInvincible = false;
    this.attackCD = 0; this.combo = 0;
    this.facingRight = true; this.alive = true;
    this.onGround = true;

    // 跳跃
    this.isJumping = false; this.jumpCD = 0;
    // 冲刺
    this.isDashing = false; this.dashCD = 0; this.dashTimer = 0; this.dashDir = 0;
    // 技能
    this.skillCDs = {}; SKILLS.forEach(s=>{ this.skillCDs[s.id] = 0; });
    this.usingSkill = null; this.skillTimer = 0;
  }

  handleMovement(dirX, dirY) {
    if (!this.alive||this.isDashing||this.isAttacking||this.usingSkill) return;
    this.setVelocityX(dirX * PLAYER_CONFIG.SPEED);
    if (dirX>0.1){this.setFlipX(false);this.facingRight=true;} else if(dirX<-0.1){this.setFlipX(true);this.facingRight=false;}
    if (dirY<-0.3&&this.currentLane>0){this.currentLane--;this.targetLaneY=LANE_LIST[this.currentLane];}
    else if(dirY>0.3&&this.currentLane<3){this.currentLane++;this.targetLaneY=LANE_LIST[this.currentLane];}
  }

  jump() {
    if (!this.alive||this.isDashing||this.jumpCD>0||this.isJumping) return;
    this.isJumping = true; this.jumpCD = PLAYER_CONFIG.JUMP_COOLDOWN; this.onGround = false;
    this.body.setAllowGravity(true);
    this.setVelocityY(PLAYER_CONFIG.JUMP_VELOCITY);
    this.scene.time.delayedCall(500, ()=>{ this.body.setAllowGravity(false); });
  }

  dash() {
    if (!this.alive||this.isDashing||this.dashCD>0||!this.onGround) return;
    this.isDashing = true; this.isInvincible = true;
    this.dashDir = this.facingRight?1:-1;
    this.dashTimer = PLAYER_CONFIG.DASH_DURATION;
    this.dashCD = PLAYER_CONFIG.DASH_COOLDOWN;
    this.setVelocityX(this.dashDir * PLAYER_CONFIG.DASH_SPEED);
    // 残影
    for (let i=1;i<=3;i++) {
      this.scene.time.delayedCall(i*40,()=>{
        if(!this.alive)return;
        const ghost = this.scene.add.image(this.x,this.y,'player_idle').setAlpha(0.3).setDepth(9).setOrigin(0.5,1);
        if(!this.facingRight)ghost.setFlipX(true);
        this.scene.tweens.add({targets:ghost,alpha:0,duration:200,onComplete:()=>ghost.destroy()});
      });
    }
  }

  attack() {
    if (!this.alive||this.isDashing||this.isAttacking||this.usingSkill) return;
    if (this.attackCD>0) return;
    this.isAttacking = true; this.attackCD = PLAYER_CONFIG.ATTACK_COOLDOWN;
    this.setTexture('player_attack'); if(!this.facingRight)this.setFlipX(true);
    const atkX = this.facingRight?this.x+PLAYER_CONFIG.ATTACK_RANGE/2:this.x-PLAYER_CONFIG.ATTACK_RANGE/2;
    const hit = this.scene.combatSystem.playerAttack(atkX, this.y, PLAYER_CONFIG.ATTACK_RANGE, PLAYER_CONFIG.ATTACK_DAMAGE);
    this._slashFx(atkX, this.y-20);
    if(hit) this._hitStop(40);
    this.scene.time.delayedCall(220,()=>{if(!this.alive)return;this.isAttacking=false;this.setTexture('player_idle');if(!this.facingRight)this.setFlipX(true);});
  }

  useSkill(skillId) {
    if (!this.alive||this.isDashing||this.isAttacking||this.usingSkill||this.skillCDs[skillId]>0) return;
    const sk = SKILLS.find(s=>s.id===skillId); if(!sk)return;
    this.skillCDs[skillId] = sk.cooldown;
    this.scene.controls.startSkillCooldown(skillId);
    this.usingSkill = skillId; this.skillTimer = sk.duration||400;
    this.setTexture('player_attack'); if(!this.facingRight)this.setFlipX(true);

    const fx = this.facingRight?this.x+sk.range/2:this.x-sk.range/2;
    const fy = this.y-20;

    switch(sk.type) {
      case 'melee': {
        this.scene.combatSystem.playerAttack(fx, this.y, sk.range, sk.damage);
        this._slashFx(fx, fy, 1.5);
        if(sk.knockup) this.scene.enemies.forEach(e=>{
          if(e&&e.alive&&Phaser.Math.Distance.Between(fx,this.y,e.x,e.y)<sk.range+e.enemyConfig.w/2) {
            e.setVelocityY(-200);
          }
        });
        this._hitStop(60);
        break;
      }
      case 'projectile': {
        const wave = this.scene.add.rectangle(this.x, this.y-16, 30, 20, 0x3498db, 0.8).setDepth(12);
        this.scene.physics.add.existing(wave);
        wave.body.setAllowGravity(false);
        wave.body.setVelocityX((this.facingRight?1:-1)*sk.speed);
        this.scene.time.delayedCall(800,()=>wave.destroy());
        // 碰撞检测定时器
        const check = this.scene.time.addEvent({delay:30,loop:true,callback:()=>{
          if(!wave.active){check.remove();return;}
          this.scene.enemies.forEach(e=>{ if(e&&e.alive&&Phaser.Math.Distance.Between(wave.x,wave.y,e.x,e.y)<50) { e.takeDamage(sk.damage,this.x); this._hitFx(e.x,e.y-20); }});
        }});
        break;
      }
      case 'aoe': {
        // 持续旋转攻击
        const check2 = this.scene.time.addEvent({delay:80,repeat:sk.hits-1,callback:()=>{
          if(!this.alive)return;
          const cx = this.facingRight?this.x+sk.range/2:this.x-sk.range/2;
          this.scene.combatSystem.playerAttack(cx,this.y,sk.range,sk.damage);
          this._slashFx(cx,this.y-20,0.8);
          this._hitStop(30);
        }});
        break;
      }
      case 'charge': {
        this.isInvincible = true;
        this.setVelocityX((this.facingRight?1:-1)*300);
        this.setVelocityY(-200);
        this.scene.time.delayedCall(300,()=>{
          if(!this.alive)return;
          this.setVelocityY(0);
          this.scene.combatSystem.playerAttack(this.x,this.y,sk.aoeRange,sk.damage);
          // AOE 冲击波
          const boom = this.scene.add.circle(this.x,this.y,sk.aoeRange,0xff6b6b,0.3).setDepth(15);
          this.scene.tweens.add({targets:boom,scaleX:2,scaleY:2,alpha:0,duration:400,onComplete:()=>boom.destroy()});
          this.scene.cameras.main.shake(200,0.01);
          this.isInvincible = false;
        });
        break;
      }
    }

    this.scene.time.delayedCall(sk.duration||400,()=>{
      if(!this.alive)return; this.usingSkill=null;
      this.setTexture('player_idle'); if(!this.facingRight)this.setFlipX(true);
    });
  }

  takeDamage(amount, knockbackX) {
    if (!this.alive||this.isInvincible||this.isDashing) return;
    this.hp -= amount; if (this.hp<0) this.hp=0;
    this.isInvincible = true; this.setTexture('player_hurt');
    this.setVelocityX(knockbackX); this.setVelocityY(-60);
    this.scene.tweens.add({targets:this,alpha:{from:0.3,to:1},duration:100,repeat:4,onComplete:()=>{if(this.alive){this.setTexture('player_idle');if(!this.facingRight)this.setFlipX(true);}}});
    this.scene.time.delayedCall(PLAYER_CONFIG.INVINCIBLE_TIME,()=>{this.isInvincible=false;if(this.alive){this.alpha=1;this.setTexture('player_idle');if(!this.facingRight)this.setFlipX(true);}});
    this.scene.cameras.main.shake(120,0.008);
    if (this.hp<=0) this.die();
    this.combo = 0;
  }

  die() {
    this.alive=false; this.setVelocityX(0); this.setVelocityY(0); this.setTint(0x888888);
    this.scene.tweens.add({targets:this,alpha:0,y:this.y+30,duration:800,onComplete:()=>this.scene.onPlayerDeath()});
  }

  _slashFx(x,y,scale=1) {
    const s = this.scene.add.image(x,y,'slash_effect').setOrigin(0.5).setDepth(11);
    if(!this.facingRight)s.setFlipX(true);
    this.scene.tweens.add({targets:s,alpha:0,scaleX:1.5*scale,scaleY:1.5*scale,duration:200,onComplete:()=>s.destroy()});
  }

  _hitFx(x,y) {
    const fx = this.scene.add.image(x,y,'hit_effect').setDepth(12);
    this.scene.tweens.add({targets:fx,alpha:0,scaleX:2,scaleY:2,duration:300,onComplete:()=>fx.destroy()});
  }

  _hitStop(ms) {
    this.scene.physics.world.timeScale = 0.3;
    this.scene.time.delayedCall(ms,()=>{this.scene.physics.world.timeScale=1;});
  }

  update(time, delta) {
    if (!this.alive) return;
    if (this.attackCD>0) this.attackCD-=delta;
    if (this.jumpCD>0) this.jumpCD-=delta;
    if (this.dashCD>0) this.dashCD-=delta;
    for (const k in this.skillCDs) { if(this.skillCDs[k]>0) this.skillCDs[k]-=delta; }

    // 冲刺
    if (this.isDashing) { this.dashTimer-=delta; if(this.dashTimer<=0){this.isDashing=false;this.isInvincible=false;this.setVelocityX(0);} }

    // 落地检测
    if (this.body.velocity.y>0 && this.y >= this.targetLaneY-5 && this.isJumping) {
      this.isJumping = false; this.onGround = true;
      this.y = this.targetLaneY; this.setVelocityY(0); this.body.setAllowGravity(false);
    }

    // 平滑通道
    if (!this.isJumping) {
      this.y += (this.targetLaneY-this.y)*0.15;
      this.onGround = true;
    }

    if (!this.isAttacking&&!this.isDashing&&!this.usingSkill) {
      if (Math.abs(this.body.velocity.x) < 5) this.setVelocityX(0);
    }
  }
}
