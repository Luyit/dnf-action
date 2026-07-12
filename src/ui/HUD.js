import Phaser from 'phaser';
import { GAME_WIDTH, COLORS, PLAYER_CONFIG, COMBO_GRADES } from '../config/GameConfig.js';

export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.kills = 0; this.score = 0;
    this.create();
  }

  create() {
    const W = GAME_WIDTH;
    // ── 左上：角色面板 ──
    const panel = this.scene.add.graphics().setScrollFactor(0).setDepth(600);
    panel.fillStyle(0x000000, 0.5); panel.fillRoundedRect(8, 8, 220, 66, 8);
    panel.lineStyle(1, 0x555555, 0.8); panel.strokeRoundedRect(8, 8, 220, 66, 8);

    // 角色剪影
    const portrait = this.scene.add.graphics().setScrollFactor(0).setDepth(601);
    portrait.fillStyle(COLORS.PLAYER, 0.8); portrait.fillRoundedRect(16,16,40,48,4);
    portrait.fillStyle(0x87ceeb,1); portrait.fillCircle(36,16,8);
    this.scene.add.text(24,16,'Lv.1',{fontSize:'9px',fontFamily:'Arial',color:'#f39c12',stroke:'#000',strokeThickness:1}).setScrollFactor(0).setDepth(602);
    
    // HP
    this.scene.add.text(64,16,'HP',{fontSize:'10px',fontFamily:'Arial',fontStyle:'bold',color:'#e74c3c',stroke:'#000',strokeThickness:1}).setScrollFactor(0).setDepth(602);
    this.hpBarBg = this.scene.add.graphics().setScrollFactor(0).setDepth(601);
    this.hpBarBg.fillStyle(COLORS.HEALTH_BG,0.8); this.hpBarBg.fillRoundedRect(84,16,120,10,3);
    this.hpBar = this.scene.add.graphics().setScrollFactor(0).setDepth(602);
    this.hpText = this.scene.add.text(144,21,'200/200',{fontSize:'9px',fontFamily:'Arial',color:'#fff',stroke:'#000',strokeThickness:1}).setOrigin(0.5).setScrollFactor(0).setDepth(603);

    // MP
    this.scene.add.text(64,34,'MP',{fontSize:'10px',fontFamily:'Arial',fontStyle:'bold',color:'#3498db',stroke:'#000',strokeThickness:1}).setScrollFactor(0).setDepth(602);
    this.mpBarBg = this.scene.add.graphics().setScrollFactor(0).setDepth(601);
    this.mpBarBg.fillStyle(0x1a3a5c,0.8); this.mpBarBg.fillRoundedRect(84,34,120,8,3);
    this.mpBar = this.scene.add.graphics().setScrollFactor(0).setDepth(602);

    // ── 右上：波次/击杀 ──
    this.waveText = this.scene.add.text(W-16,12,'',{fontSize:'16px',fontFamily:'Arial',fontStyle:'bold',color:'#f39c12',stroke:'#000',strokeThickness:3}).setOrigin(1,0).setScrollFactor(0).setDepth(600);
    this.killText = this.scene.add.text(W-16,34,'',{fontSize:'12px',fontFamily:'Arial',color:'#e74c3c',stroke:'#000',strokeThickness:2}).setOrigin(1,0).setScrollFactor(0).setDepth(600);

    // ── 中央：连击评级 ──
    this.comboGradeText = this.scene.add.text(W/2, 50, '', {fontSize:'36px',fontFamily:'Arial',fontStyle:'bold',color:'#fff',stroke:'#000',strokeThickness:4}).setOrigin(0.5).setScrollFactor(0).setDepth(600).setAlpha(0);
    this.comboCountText = this.scene.add.text(W/2, 85, '', {fontSize:'20px',fontFamily:'Arial',color:'#fff',stroke:'#000',strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(600).setAlpha(0);

    // ── 底部提示 ──
    this.hintText = this.scene.add.text(W/2, this.scene.cameras.main.height-8, '', {fontSize:'11px',fontFamily:'Arial',color:'#888',stroke:'#000',strokeThickness:2}).setOrigin(0.5,1).setScrollFactor(0).setDepth(600);

    // 初始值
    this.updateHP(PLAYER_CONFIG.MAX_HP,PLAYER_CONFIG.MAX_HP);
    this.updateMP(PLAYER_CONFIG.MAX_MP,PLAYER_CONFIG.MAX_MP);
  }

  updateHP(hp, maxHp) {
    const ratio = Math.max(0, hp/maxHp);
    this.hpBar.clear();
    const c = ratio>0.5?COLORS.HEALTH_GREEN:ratio>0.25?0xf1c40f:COLORS.HEALTH_RED;
    this.hpBar.fillStyle(c,1); this.hpBar.fillRoundedRect(84,16,120*ratio,10,3);
    this.hpText.setText(`${Math.ceil(hp)}/${maxHp}`);
  }

  updateMP(mp, maxMp) {
    this.mpBar.clear();
    this.mpBar.fillStyle(COLORS.MP_BLUE,1); this.mpBar.fillRoundedRect(84,34,120*(mp/maxMp),8,3);
  }

  updateWave(num, total) {
    this.waveText.setText(`第 ${num}/${total} 波`);
  }

  updateKills(k) { this.kills=k; this.killText.setText(`击杀 ${k}`); }
  updateScore(s) { this.score=s; }

  updateCombo(combo, grade) {
    if (combo >= 5) {
      this.comboGradeText.setText(grade.grade);
      this.comboGradeText.setColor(grade.color).setAlpha(1);
      this.comboCountText.setText(`${combo} HITS`).setAlpha(1);
      this.scene.tweens.add({targets:this.comboGradeText,scaleX:1.3,scaleY:1.3,duration:100,yoyo:true,ease:'Back.easeOut'});
    } else {
      this.comboGradeText.setAlpha(0);
      this.comboCountText.setAlpha(0);
    }
  }

  showHint(txt, dur=3000) {
    this.hintText.setText(txt).setAlpha(1);
    this.scene.tweens.add({targets:this.hintText,alpha:0,delay:dur,duration:500});
  }

  update() {
    const cs = this.scene.combatSystem;
    this.updateHP(this.scene.player.hp, this.scene.player.maxHp);
    this.updateMP(this.scene.player.mp, this.scene.player.maxMp);
    this.updateCombo(cs.getCombo(), cs.getComboGrade());
  }
}
