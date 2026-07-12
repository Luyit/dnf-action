import Phaser from 'phaser';
import { ENEMY_TYPES, LANE_LIST, GAME_WIDTH } from '../config/GameConfig.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, lane, type='BASIC') {
    const cfg=ENEMY_TYPES[type]; const y=LANE_LIST[lane];
    super(scene,x,y,`enemy_${type.toLowerCase()}`);
    scene.add.existing(this); scene.physics.add.existing(this);
    this.enemyType=type; this.enemyConfig=cfg; this.hp=cfg.hp; this.maxHp=cfg.hp;
    this.lane=lane; this.aiState='patrol'; this.attackCD=0; this.patrolDir=1;
    this.patrolTimer=0; this.hurtTimer=0; this.alive=true;
    this.setFlipX(true); this.body.setSize(cfg.w*0.6,cfg.h*0.7);
    this.setOrigin(0.5,1);
    // Boss 标记
    this.isBoss = type==='BOSS';
    if(type==='ELITE'||type==='BOSS') this.setScale(1.2);
    this.setAlpha(0); scene.tweens.add({targets:this,alpha:1,duration:300});
    if(this.isBoss) this._showBossBar();
  }

  _showBossBar() {
    const W = GAME_WIDTH;
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(600);
    g.fillStyle(0x000000,0.5); g.fillRoundedRect(W/2-120,4,240,16,4);
    this.bossBarBg = g;
    this.bossBar = this.scene.add.graphics().setScrollFactor(0).setDepth(601);
    this.bossName = this.scene.add.text(W/2,12,this.enemyConfig.name,{fontSize:'11px',fontFamily:'Arial',fontStyle:'bold',color:'#fff',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setScrollFactor(0).setDepth(602);
    this._updateBossBar();
  }

  _updateBossBar() {
    if(!this.bossBar)return;
    this.bossBar.clear();
    const W=GAME_WIDTH, ratio=this.hp/this.maxHp;
    const c = ratio>0.5?0xe74c3c:ratio>0.25?0xf39c12:0xff0000;
    this.bossBar.fillStyle(c,1); this.bossBar.fillRoundedRect(W/2-118,6,236*ratio,12,4);
  }

  takeDamage(amount, attackerX) {
    if(!this.alive)return;
    this.hp-=amount; this.aiState='hurt'; this.hurtTimer=200;
    this.setTint(0xff4444);
    const kb=this.x>attackerX?1:-1; this.setVelocityX(kb*150); this.setVelocityY(-40);
    this._showDmgNum(amount);
    this._hitFx();
    if(this.isBoss)this._updateBossBar();
    if(this.hp<=0)this.die();
  }

  _showDmgNum(amount) {
    const txt=this.scene.add.text(this.x+Phaser.Math.Between(-20,20),this.y-50,`-${amount}`,{fontSize:'18px',fontFamily:'Arial',fontStyle:'bold',color:'#ff4444',stroke:'#000',strokeThickness:3}).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({targets:txt,y:txt.y-40,alpha:0,duration:800,onComplete:()=>txt.destroy()});
  }

  _hitFx() {
    const fx=this.scene.add.image(this.x,this.y-20,'hit_effect').setDepth(12);
    this.scene.tweens.add({targets:fx,alpha:0,scaleX:2,scaleY:2,duration:300,onComplete:()=>fx.destroy()});
  }

  die() {
    if(!this.alive)return; this.alive=false; this.aiState='dead'; this.body.enable=false;
    if(this.bossBarBg){this.bossBarBg.destroy();this.bossBar.destroy();this.bossName.destroy();}
    this.setTint(0x555555);
    // Boss 死亡爆炸
    if(this.isBoss) {
      for(let i=0;i<8;i++){
        const p=this.scene.add.circle(this.x+Phaser.Math.Between(-40,40),this.y+Phaser.Math.Between(-40,20),Phaser.Math.Between(3,8),0xff6b6b,0.8).setDepth(15);
        this.scene.tweens.add({targets:p,x:p.x+Phaser.Math.Between(-80,80),y:p.y-Phaser.Math.Between(50,100),alpha:0,duration:600,onComplete:()=>p.destroy()});
      }
    }
    this.scene.tweens.add({targets:this,alpha:0,duration:500,onComplete:()=>{this.scene.combatSystem.enemyDefeated(this);this.destroy();}});
  }

  update(time, delta) {
    if(!this.alive||!this.body)return;
    const player=this.scene.player; if(!player||!player.alive){this.setVelocityX(0);return;}
    const dist=Phaser.Math.Distance.Between(this.x,this.y,player.x,player.y);
    const cfg=this.enemyConfig;

    if(this.aiState==='hurt'){this.hurtTimer-=delta;if(this.hurtTimer<=0){this.clearTint();this.aiState='chase';}if(this.hurtTimer>100)return;}
    if(this.attackCD>0)this.attackCD-=delta;
    if(player.x<this.x)this.setFlipX(true);else this.setFlipX(false);

    switch(this.aiState) {
      case'patrol':
        this.patrolTimer+=delta; if(this.patrolTimer>2000){this.patrolTimer=0;this.patrolDir*=-1;}
        this.setVelocityX(this.patrolDir*cfg.speed*0.4);
        if(dist<cfg.chaseRange)this.aiState='chase';
        break;
      case'chase':
        this.setVelocityX((player.x<this.x?-1:1)*cfg.speed);
        if(this.isBoss){
          // Boss 会尝试切换通道
          if(player.y<this.y-40)this.setVelocityY(-60);
          else if(player.y>this.y+40)this.setVelocityY(60);
          else this.setVelocityY(0);
        }else{
          if(player.y<this.y-30)this.setVelocityY(-60);
          else if(player.y>this.y+30)this.setVelocityY(60);
          else this.setVelocityY(0);
        }
        if(dist<cfg.atkRange&&this.attackCD<=0){this.aiState='attack';this.attackCD=cfg.atkCD;this.scene.combatSystem.enemyAttack(this,player);this.aiState='chase';}
        else if(dist>cfg.chaseRange*1.5)this.aiState='patrol';
        break;
    }
    if(this.x<-100)this.destroy();
  }
}
