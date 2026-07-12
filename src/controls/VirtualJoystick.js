import Phaser from 'phaser';

/**
 * 虚拟摇杆控制器
 * 屏幕左下角的触摸/鼠标拖动轮盘，控制角色移动方向
 * 同时支持键盘 WSAD / 方向键作为后备输入
 */
export class VirtualJoystick {
  constructor(scene, x, y, radius = 80) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.radius = radius;

    // 方向输出
    this.dirX = 0;
    this.dirY = 0;
    this.isActive = false;

    // 攻击按钮状态
    this.attackPressed = false;
    this.attackJustPressed = false;

    this.createJoystickGfx();
    this.createAttackButton();
    this.setupKeyboardInput();
  }

  /**
   * 创建摇杆图形
   */
  createJoystickGfx() {
    const r = this.radius;

    // 底座
    this.baseCircle = this.scene.add.graphics();
    this.baseCircle.fillStyle(0xffffff, 0.1);
    this.baseCircle.fillCircle(this.baseX, this.baseY, r);
    this.baseCircle.lineStyle(2, 0xffffff, 0.3);
    this.baseCircle.strokeCircle(this.baseX, this.baseY, r);
    this.baseCircle.setDepth(100);

    // 杆头
    this.thumbCircle = this.scene.add.graphics();
    this.thumbCircle.fillStyle(0xffffff, 0.35);
    this.thumbCircle.fillCircle(this.baseX, this.baseY, r * 0.4);
    this.thumbCircle.fillStyle(0xffffff, 0.5);
    this.thumbCircle.fillCircle(this.baseX, this.baseY, r * 0.2);
    this.thumbCircle.setDepth(101);

    // 触摸/鼠标事件
    const interactiveZone = this.scene.add.zone(this.baseX, this.baseY, r * 3, r * 3)
      .setDepth(99)
      .setInteractive();

    this.scene.input.on('pointerdown', (pointer) => {
      // 只在左半屏响应摇杆
      if (pointer.x < this.scene.cameras.main.width / 2) {
        this.isActive = true;
        this.updateThumb(pointer);
      }
    });

    this.scene.input.on('pointermove', (pointer) => {
      if (this.isActive) {
        this.updateThumb(pointer);
      }
    });

    this.scene.input.on('pointerup', () => {
      this.isActive = false;
      this.dirX = 0;
      this.dirY = 0;
      this.thumbCircle.setPosition(this.baseX, this.baseY);
    });
  }

  /**
   * 更新杆头位置和方向
   */
  updateThumb(pointer) {
    let dx = pointer.x - this.baseX;
    let dy = pointer.y - this.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.radius) {
      dx = (dx / dist) * this.radius;
      dy = (dy / dist) * this.radius;
    }

    this.thumbCircle.setPosition(this.baseX + dx, this.baseY + dy);

    // 归一化方向（带死区）
    const deadzone = 0.2;
    if (dist < this.radius * deadzone) {
      this.dirX = 0;
      this.dirY = 0;
    } else {
      this.dirX = dx / this.radius;
      this.dirY = dy / this.radius;
    }
  }

  /**
   * 创建攻击按钮
   */
  createAttackButton() {
    const btnX = this.scene.cameras.main.width - this.radius - 20;
    const btnY = this.baseY;
    const btnR = 45;

    // 按钮背景
    this.atkBtnBg = this.scene.add.graphics();
    this.atkBtnBg.fillStyle(0xe74c3c, 0.4);
    this.atkBtnBg.fillCircle(btnX, btnY, btnR);
    this.atkBtnBg.lineStyle(2, 0xe74c3c, 0.6);
    this.atkBtnBg.strokeCircle(btnX, btnY, btnR);
    this.atkBtnBg.setDepth(100);

    // 按钮文字
    this.atkLabel = this.scene.add.text(btnX, btnY, '攻击', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(101);

    // 技能按钮文字
    // 普通攻击标签
    this.atkSubLabel = this.scene.add.text(btnX, btnY + 22, '普攻', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffcccc',
    }).setOrigin(0.5).setDepth(101);

    // 触摸/点击区域
    const atkZone = this.scene.add.zone(btnX, btnY, btnR * 2.5, btnR * 2.5)
      .setDepth(99)
      .setInteractive();

    atkZone.on('pointerdown', () => {
      this.attackPressed = true;
      this.attackJustPressed = true;
      this.atkBtnBg.clear();
      this.atkBtnBg.fillStyle(0xff6b6b, 0.6);
      this.atkBtnBg.fillCircle(btnX, btnY, btnR);
      this.atkBtnBg.lineStyle(2, 0xff6b6b, 0.8);
      this.atkBtnBg.strokeCircle(btnX, btnY, btnR);

      // 缩放反馈
      this.scene.tweens.add({
        targets: [this.atkBtnBg, this.atkLabel, this.atkSubLabel],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 50,
        yoyo: true,
      });
    });

    atkZone.on('pointerup', () => {
      this.attackPressed = false;
      this.atkBtnBg.clear();
      this.atkBtnBg.fillStyle(0xe74c3c, 0.4);
      this.atkBtnBg.fillCircle(btnX, btnY, btnR);
      this.atkBtnBg.lineStyle(2, 0xe74c3c, 0.6);
      this.atkBtnBg.strokeCircle(btnX, btnY, btnR);
    });

    atkZone.on('pointerout', () => {
      this.attackPressed = false;
      this.atkBtnBg.clear();
      this.atkBtnBg.fillStyle(0xe74c3c, 0.4);
      this.atkBtnBg.fillCircle(btnX, btnY, btnR);
      this.atkBtnBg.lineStyle(2, 0xe74c3c, 0.6);
      this.atkBtnBg.strokeCircle(btnX, btnY, btnR);
    });
  }

  /**
   * 键盘输入支持
   */
  setupKeyboardInput() {
    this.keys = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
    });

    this.arrowKeys = this.scene.input.keyboard.createCursorKeys();
  }

  /**
   * 获取综合方向输入（摇杆 + 键盘）
   */
  getDirection() {
    let x = this.dirX;
    let y = this.dirY;

    // 键盘覆盖
    if (this.keys.left.isDown || this.arrowKeys.left.isDown) x = -1;
    if (this.keys.right.isDown || this.arrowKeys.right.isDown) x = 1;
    if (this.keys.up.isDown || this.arrowKeys.up.isDown) y = -1;
    if (this.keys.down.isDown || this.arrowKeys.down.isDown) y = 1;

    return { x, y };
  }

  /**
   * 获取攻击输入
   */
  getAttackInput() {
    const keyPressed = Phaser.Input.Keyboard.JustDown(this.keys.attack);
    if (this.attackJustPressed || keyPressed) {
      this.attackJustPressed = false;
      return true;
    }
    return false;
  }

  /**
   * 每帧更新
   */
  update() {
    // 攻击按钮刚刚按下检测（仅保留一帧）
    if (this.attackJustPressed) {
      // 仅在本帧有效，由 getAttackInput 消费
    }
  }

  /**
   * 销毁控件
   */
  destroy() {
    if (this.baseCircle) this.baseCircle.destroy();
    if (this.thumbCircle) this.thumbCircle.destroy();
    if (this.atkBtnBg) this.atkBtnBg.destroy();
    if (this.atkLabel) this.atkLabel.destroy();
    if (this.atkSubLabel) this.atkSubLabel.destroy();
  }
}
