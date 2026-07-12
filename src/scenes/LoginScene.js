import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig.js';

/**
 * 登录场景 - 纯前端账号系统 (localStorage)
 */
export class LoginScene extends Phaser.Scene {
  constructor() { super('LoginScene'); }

  create() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const cx = W / 2;

    // 黑暗背景
    this.add.graphics().fillStyle(0x0a0a14, 1).fillRect(0, 0, W, H);

    // 飘浮粒子
    for (let i = 0; i < 30; i++) {
      const p = this.add.circle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.Between(1, 3), 0x6c5ce7, Phaser.Math.FloatBetween(0.2, 0.6));
      this.tweens.add({ targets: p, y: p.y - Phaser.Math.Between(30, 80), alpha: 0, duration: Phaser.Math.Between(2000, 4000), repeat: -1, yoyo: true });
    }

    // 标题
    this.add.text(cx, 120, 'DUNGEON & FIGHTER', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#f39c12', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(cx, 165, '横 版 动 作', {
      fontSize: '18px', fontFamily: 'Arial',
      color: '#a29bfe', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    // 登录面板
    this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(cx - 160, 210, 320, 200, 12)
      .lineStyle(1, 0x555555, 0.8).strokeRoundedRect(cx - 160, 210, 320, 200, 12);

    this.add.text(cx, 235, '账 号 登 录', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);

    // 用户名输入框
    this.add.text(cx - 130, 270, '用户名', { fontSize: '13px', fontFamily: 'Arial', color: '#aaa' });
    this._drawInputBox(cx - 130, 286, 260, 32);
    this.usernameInput = this.add.text(cx - 120, 292, '', { fontSize: '14px', fontFamily: 'Arial', color: '#fff' }).setDepth(5);
    this.usernameText = '';
    this.usernameActive = true;

    // 密码输入框
    this.add.text(cx - 130, 330, '密码', { fontSize: '13px', fontFamily: 'Arial', color: '#aaa' });
    this._drawInputBox(cx - 130, 346, 260, 32);
    this.passwordInput = this.add.text(cx - 120, 352, '', { fontSize: '14px', fontFamily: 'Arial', color: '#fff' }).setDepth(5);
    this.passwordText = '';
    this.passwordActive = false;

    // 登录按钮
    const btnX = cx, btnY = 405;
    this.add.graphics().fillStyle(0xf39c12, 0.9).fillRoundedRect(btnX - 70, btnY - 18, 140, 36, 6);
    const btnText = this.add.text(btnX, btnY, '登  录', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#000' }).setOrigin(0.5).setDepth(10);

    const btnZone = this.add.zone(btnX, btnY, 140, 36).setInteractive();
    btnZone.on('pointerdown', () => this._doLogin());
    btnZone.on('pointerover', () => { btnText.setColor('#fff'); });
    btnZone.on('pointerout', () => { btnText.setColor('#000'); });

    // 注册提示
    const regText = this.add.text(cx, 440, '没有账号？点击注册', { fontSize: '12px', fontFamily: 'Arial', color: '#74b9ff' }).setOrigin(0.5).setInteractive();
    regText.on('pointerdown', () => this._doRegister());
    regText.on('pointerover', () => regText.setColor('#a29bfe'));
    regText.on('pointerout', () => regText.setColor('#74b9ff'));

    // 游客登录
    const guestText = this.add.text(cx, 470, '游客模式（直接进入）', { fontSize: '12px', fontFamily: 'Arial', color: '#636e72' }).setOrigin(0.5).setInteractive();
    guestText.on('pointerdown', () => this._loginAsGuest());
    guestText.on('pointerover', () => guestText.setColor('#888'));
    guestText.on('pointerout', () => guestText.setColor('#636e72'));

    // 键盘输入
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        this.usernameActive = !this.usernameActive;
        this.passwordActive = !this.passwordActive;
        return;
      }
      if (event.key === 'Enter') { this._doLogin(); return; }

      const active = this.usernameActive ? 'username' : 'password';
      if (event.key === 'Backspace') {
        if (active === 'username') { this.usernameText = this.usernameText.slice(0, -1); this.usernameInput.setText(this.usernameText); }
        else { this.passwordText = this.passwordText.slice(0, -1); this.passwordInput.setText('*'.repeat(this.passwordText.length)); }
      } else if (event.key.length === 1) {
        if (active === 'username' && this.usernameText.length < 12) { this.usernameText += event.key; this.usernameInput.setText(this.usernameText); }
        else if (active === 'password' && this.passwordText.length < 16) { this.passwordText += event.key; this.passwordInput.setText('*'.repeat(this.passwordText.length)); }
      }
    });

    // 闪烁光标
    this.cursorVisible = true;
    this.time.addEvent({ delay: 500, loop: true, callback: () => { this.cursorVisible = !this.cursorVisible; } });

    // 尝试自动登录
    const saved = localStorage.getItem('dnf_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user.username) {
          this.time.delayedCall(600, () => this._enterGame(user));
        }
      } catch (e) { /* ignore */ }
    }
  }

  _drawInputBox(x, y, w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x1a1a2e, 0.8); g.fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(1, 0x444466, 1); g.strokeRoundedRect(x, y, w, h, 4);
  }

  _doLogin() {
    if (!this.usernameText.trim()) {
      this._showMsg('请输入用户名');
      return;
    }
    if (!this.passwordText) {
      this._showMsg('请输入密码');
      return;
    }
    // 检查本地存储
    const saved = localStorage.getItem(`dnf_account_${this.usernameText}`);
    if (saved) {
      const acc = JSON.parse(saved);
      if (acc.password === this.passwordText) {
        const user = { username: this.usernameText, level: acc.level || 1, exp: acc.exp || 0 };
        localStorage.setItem('dnf_user', JSON.stringify(user));
        this._enterGame(user);
      } else {
        this._showMsg('密码错误');
      }
    } else {
      this._showMsg('账号不存在，请先注册');
    }
  }

  _doRegister() {
    if (!this.usernameText.trim()) {
      this._showMsg('请输入用户名');
      return;
    }
    if (!this.passwordText || this.passwordText.length < 3) {
      this._showMsg('密码至少3位');
      return;
    }
    const saved = localStorage.getItem(`dnf_account_${this.usernameText}`);
    if (saved) {
      this._showMsg('账号已存在');
      return;
    }
    // 注册
    const acc = { username: this.usernameText, password: this.passwordText, level: 1, exp: 0 };
    localStorage.setItem(`dnf_account_${this.usernameText}`, JSON.stringify(acc));
    const user = { username: this.usernameText, level: 1, exp: 0 };
    localStorage.setItem('dnf_user', JSON.stringify(user));
    this._showMsg('注册成功！正在进入...');
    this.time.delayedCall(800, () => this._enterGame(user));
  }

  _loginAsGuest() {
    const user = { username: 'Guest_' + Date.now().toString(36), level: 1, exp: 0 };
    localStorage.setItem('dnf_user', JSON.stringify(user));
    this._enterGame(user);
  }

  _enterGame(user) {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('MainMenuScene', { user });
    });
  }

  _showMsg(text) {
    const msg = this.add.text(GAME_WIDTH / 2, 500, text, {
      fontSize: '14px', fontFamily: 'Arial', color: '#ff6b6b', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: msg, alpha: 0, y: msg.y - 20, delay: 1500, duration: 500, onComplete: () => msg.destroy() });
  }

  update() {
    // 输入框下划线闪烁（简化：用文字颜色变化表示激活状态）
    if (this.usernameActive) {
      this.usernameInput.setColor(this.cursorVisible ? '#fff' : '#888');
    }
    if (this.passwordActive) {
      this.passwordInput.setColor(this.cursorVisible ? '#fff' : '#888');
    }
  }
}
