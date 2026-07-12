import Phaser from 'phaser';
import { SKILLS } from '../config/GameConfig.js';

/**
 * DNF 手游风格操作控件（屏幕固定）
 * - 左下：方向轮盘
 * - 右下：跳跃 + 攻击 + 技能栏
 */
export class GameControls {
  constructor(scene) {
    this.scene = scene;
    this.dirX = 0; this.dirY = 0; this.isJoystickActive = false;
    this.attackPressed = false; this.attackJust = false;
    this.jumpJust = false; this.jumpPressed = false;
    this.dashJust = false;
    this.skillsTriggered = {}; // { skillId: true }
    this.skillCooldownTimers = {}; // { skillId: remaining }

    const W = scene.cameras.main.width;
    const H = scene.cameras.main.height;

    this.createDpad(W, H);
    this.createActionButtons(W, H);
    this.createSkillBar(W, H);
    this.setupKeyboard();
  }

  // ── 方向轮盘（左下）──
  createDpad(W, H) {
    const cx = 110; const cy = H - 150; const r = 70;
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(500);
    g.fillStyle(0xffffff, 0.08); g.fillCircle(cx, cy, r);
    g.lineStyle(2, 0xffffff, 0.25); g.strokeCircle(cx, cy, r);
    // 十字线
    g.lineStyle(1, 0xffffff, 0.1);
    g.lineBetween(cx - r, cy, cx + r, cy);
    g.lineBetween(cx, cy - r, cx, cy + r);
    this.dpadBase = g;

    const thumb = this.scene.add.graphics().setScrollFactor(0).setDepth(501);
    thumb.fillStyle(0xffffff, 0.3); thumb.fillCircle(cx, cy, 28);
    thumb.fillStyle(0xffffff, 0.5); thumb.fillCircle(cx, cy, 12);
    this.dpadThumb = thumb;

    // 触摸
    this.scene.input.on('pointerdown', (p) => {
      if (p.x < W * 0.45 && p.y > H * 0.35) { this.isJoystickActive = true; this._updateThumb(p, cx, cy, r); }
      if (p.x > W * 0.5 && p.y > H * 0.2) this._checkActionHit(p);
    });
    this.scene.input.on('pointermove', (p) => { if (this.isJoystickActive) this._updateThumb(p, cx, cy, r); });
    this.scene.input.on('pointerup', () => { this.isJoystickActive = false; this.dirX = 0; this.dirY = 0; thumb.setPosition(cx, cy); });
  }

  _updateThumb(p, cx, cy, r) {
    let dx = p.x - cx, dy = p.y - cy;
    const dist = Math.sqrt(dx*dx+dy*dy);
    if (dist > r) { dx = dx/dist*r; dy = dy/dist*r; }
    this.dpadThumb.setPosition(cx+dx, cy+dy);
    this.dirX = dist < r*0.2 ? 0 : dx/r;
    this.dirY = dist < r*0.2 ? 0 : dy/r;
  }

  // ── 操作按钮（右下）──
  createActionButtons(W, H) {
    // 攻击按钮
    const aX = W - 100, aY = H - 130, aR = 50;
    const atkG = this.scene.add.graphics().setScrollFactor(0).setDepth(500);
    atkG.fillStyle(0xcc3333, 0.5); atkG.fillCircle(aX, aY, aR);
    atkG.lineStyle(2, 0xff6666, 0.7); atkG.strokeCircle(aX, aY, aR);
    this.scene.add.text(aX, aY, '攻击', { fontSize:'16px', fontFamily:'Arial', fontStyle:'bold', color:'#fff', stroke:'#000', strokeThickness:3 }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

    this._makeBtnZone(aX, aY, aR, () => { this.attackPressed = true; this.attackJust = true; });

    // 跳跃按钮
    const jX = W - 180, jY = H - 190, jR = 28;
    const jG = this.scene.add.graphics().setScrollFactor(0).setDepth(500);
    jG.fillStyle(0x3498db, 0.4); jG.fillCircle(jX, jY, jR);
    jG.lineStyle(2, 0x5dade2, 0.6); jG.strokeCircle(jX, jY, jR);
    this.scene.add.text(jX, jY, '跳', { fontSize:'13px', fontFamily:'Arial', fontStyle:'bold', color:'#fff', stroke:'#000', strokeThickness:2 }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

    this._makeBtnZone(jX, jY, jR*1.3, () => { this.jumpJust = true; this.jumpPressed = true; }, () => { this.jumpPressed = false; });
  }

  // ── 技能栏（攻击按钮上方）──
  createSkillBar(W, H) {
    this.skillBtns = [];
    const startX = W - 250, y = H - 240, spacing = 56;
    SKILLS.forEach((sk, i) => {
      const x = startX + i * spacing;
      const gfx = this.scene.add.graphics().setScrollFactor(0).setDepth(500);
      this._drawSkillBtn(gfx, x, y, sk, false);
      const txt = this.scene.add.text(x, y-5, sk.name, { fontSize:'10px', fontFamily:'Arial', color:'#fff', stroke:'#000', strokeThickness:2 }).setOrigin(0.5).setScrollFactor(0).setDepth(502);
      const cdTxt = this.scene.add.text(x, y+5, sk.key, { fontSize:'9px', fontFamily:'Arial', color:'#aaa', stroke:'#000', strokeThickness:1 }).setOrigin(0.5).setScrollFactor(0).setDepth(502);
      const cdOverlay = this.scene.add.graphics().setScrollFactor(0).setDepth(503);

      this._makeBtnZone(x, y, 24, () => { this.skillsTriggered[sk.id] = true; });
      this.skillBtns.push({ sk, x, y, gfx, txt, cdTxt, cdOverlay, cd:0 });
    });
  }

  _drawSkillBtn(g, x, y, sk, onCd) {
    g.clear();
    g.fillStyle(onCd ? 0x333333 : 0x2c3e50, 0.7); g.fillRoundedRect(x-22, y-22, 44, 44, 6);
    g.lineStyle(2, onCd ? 0x555555 : 0x7f8c8d, 0.8); g.strokeRoundedRect(x-22, y-22, 44, 44, 6);
  }

  _makeBtnZone(x, y, r, onDown, onUp) {
    const z = this.scene.add.zone(x, y, r*2.5, r*2.5).setScrollFactor(0).setDepth(499).setInteractive();
    z.on('pointerdown', onDown);
    if (onUp) { z.on('pointerup', onUp); z.on('pointerout', onUp); }
  }

  _checkActionHit(p) {
    // 简单：仅通过 attack/jump 预定义区域判断，技能栏用独立 zone 处理
  }

  // ── 键盘 ──
  setupKeyboard() {
    const kb = this.scene.input.keyboard;
    this.keys = kb.addKeys({ up:kb.keyCodes.W, down:kb.keyCodes.S, left:kb.keyCodes.A, right:kb.keyCodes.D, jump:kb.keyCodes.K, attack:kb.keyCodes.J, dash:kb.keyCodes.SHIFT });
    this.arrowKeys = kb.createCursorKeys();
    this.skillKeys = {};
    SKILLS.forEach(s => { this.skillKeys[s.id] = kb.addKey(s.key); });
  }

  getDirection() {
    let x=this.dirX, y=this.dirY;
    if (this.keys.left.isDown||this.arrowKeys.left.isDown) x=-1;
    if (this.keys.right.isDown||this.arrowKeys.right.isDown) x=1;
    if (this.keys.up.isDown||this.arrowKeys.up.isDown) y=-1;
    if (this.keys.down.isDown||this.arrowKeys.down.isDown) y=1;
    return {x,y};
  }

  getAttack() { const v=this.attackJust; this.attackJust=false; return v||Phaser.Input.Keyboard.JustDown(this.keys.attack); }
  getJump() { const v=this.jumpJust; this.jumpJust=false; return v||Phaser.Input.Keyboard.JustDown(this.keys.jump); }
  getDash() { return this.dashJust||Phaser.Input.Keyboard.JustDown(this.keys.dash); }

  getSkillTriggered(id) {
    const v=this.skillsTriggered[id]||false;
    if (v) this.skillsTriggered[id]=false;
    return v||Phaser.Input.Keyboard.JustDown(this.skillKeys[id]);
  }

  update(delta) {
    // 技能冷却
    this.skillBtns.forEach(b => {
      if (b.cd > 0) {
        b.cd -= delta;
        if (b.cd <= 0) { b.cd = 0; this._drawSkillBtn(b.gfx, b.x, b.y, b.sk, false); b.cdTxt.setAlpha(1); }
        b.cdOverlay.clear();
        if (b.cd > 0) {
          const pct = b.cd / b.sk.cooldown;
          b.cdOverlay.fillStyle(0x000000, 0.6);
          b.cdOverlay.fillRoundedRect(b.x-22, b.y-22+(1-pct)*44, 44, pct*44, 6);
        }
      }
    });
  }

  startSkillCooldown(id) {
    const sk = SKILLS.find(s=>s.id===id); if (!sk) return;
    const b = this.skillBtns.find(b=>b.sk.id===id); if (!b) return;
    b.cd = sk.cooldown;
    this._drawSkillBtn(b.gfx, b.x, b.y, sk, true);
  }

  getSkillCooldown(id) {
    const b = this.skillBtns.find(b=>b.sk.id===id);
    return b ? b.cd / SKILLS.find(s=>s.id===id).cooldown : 0;
  }
}
