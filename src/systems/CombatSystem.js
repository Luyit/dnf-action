import { COMBO_GRADES } from '../config/GameConfig.js';

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.combo = 0; this.comboTimer = 0; this.comboTimeout = 2500;
    this.totalKills = 0; this.totalScore = 0;
    this.currentWave = 0;
    this.waveEnemiesRemaining = 0;
    this.waveActive = false;
  }

  playerAttack(atkX, atkY, range, damage) {
    const enemies = this.scene.enemies; if(!enemies) return false;
    let hitAny = false;
    for(const e of enemies) {
      if(!e||!e.alive) continue;
      if(Phaser.Math.Distance.Between(atkX,atkY,e.x,e.y)<range+e.enemyConfig.w/2) {
        e.takeDamage(damage, this.scene.player.x); hitAny = true;
      }
    }
    if(hitAny){this.combo++;this.comboTimer=this.comboTimeout;return true;}
    return false;
  }

  enemyAttack(enemy, player) {
    if(!player.alive||player.isInvincible||player.isDashing) return;
    const kb = enemy.x>player.x?-180:180;
    player.takeDamage(enemy.enemyConfig.damage, kb);
    this.scene.cameras.main.shake(100,0.005);
  }

  enemyDefeated(enemy) {
    this.totalKills++; this.totalScore+=enemy.enemyConfig.score||100;
    this.waveEnemiesRemaining--;
    if(this.scene.hud){this.scene.hud.updateKills(this.totalKills);this.scene.hud.updateScore(this.totalScore);}
    if(this.waveEnemiesRemaining<=0&&this.waveActive){this.scene.onWaveComplete();}
  }

  getCombo() { return this.combo; }

  getComboGrade() {
    let g=COMBO_GRADES[0];
    for(let i=COMBO_GRADES.length-1;i>=0;i--){if(this.combo>=COMBO_GRADES[i].min){g=COMBO_GRADES[i];break;}}
    return g;
  }

  update(delta) {
    if(this.comboTimer>0){this.comboTimer-=delta;if(this.comboTimer<=0){this.combo=0;this.comboTimer=0;}}
  }
}
