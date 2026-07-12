# DNF Mobile Action - 架构文档

## 场景流转

```
BootScene (资源加载, 生成纹理)
  ↓
LoginScene (注册/登录/游客, localStorage)
  ↓
MainMenuScene (角色面板, 开始副本)
  ↓
GameScene (核心战斗)
```

## 文件结构

```
src/
├── main.js                    # Phaser 入口, 场景注册, 全局配置
├── config/
│   └── GameConfig.js          # 游戏常量: 通道, 玩家, 技能, 敌人, 波次, 连击评级
├── scenes/
│   ├── BootScene.js           # 启动加载: 用 Graphics 生成所有占位贴图纹理
│   ├── LoginScene.js          # 登录: 键盘输入, localStorage 账号存储
│   ├── MainMenuScene.js       # 主菜单: 角色面板, 开始按钮, 退出登录
│   └── GameScene.js           # 核心: 背景/地面, 波次系统, 更新循环, 胜负判定
├── entities/
│   ├── Player.js              # 玩家: 移动/攻击/跳跃/冲刺/技能/受伤/死亡
│   └── Enemy.js               # 敌人: 巡逻/追击/攻击 AI, Boss 血条, 伤害数字
├── controls/
│   └── VirtualJoystick.js     # 控件(类名 GameControls): 轮盘/攻击/跳跃/技能栏
├── systems/
│   └── CombatSystem.js        # 战斗: 攻击判定, 连击统计, 评级, 波次状态
└── ui/
    └── HUD.js                 # HUD: 角色面板, HP/MP, 波次, 连击评级显示
```

## 关键数据流

### 输入流
```
键盘/触摸 → GameControls.getDirection() → Player.handleMovement(dirX, dirY)
键盘/触摸 → GameControls.getAttack()     → Player.attack()
键盘/触摸 → GameControls.getJump()       → Player.jump()
键盘/触摸 → GameControls.getDash()       → Player.dash()
键盘/触摸 → GameControls.getSkillTriggered(id) → Player.useSkill(id)
```

### 战斗流
```
Player.attack()/useSkill()
  → CombatSystem.playerAttack(x, y, range, damage)
    → Enemy.takeDamage() → 受伤闪烁/击退/伤害数字
    → 命中 → combo++, hitStop
  → CombatSystem.update() → 连击超时重置

Enemy AI update()
  → 距离判定 → 巡逻/追击/攻击
  → Enemy.doAttack() → CombatSystem.enemyAttack()
    → Player.takeDamage() → 受伤/无敌/死亡
```

### 波次流
```
GameScene.startWave(n)
  → CombatSystem.waveActive=true, waveEnemiesRemaining=N
  → 分批 spawnEnemy()
  → 每消灭一个: CombatSystem.enemyDefeated() → waveEnemiesRemaining--
  → waveEnemiesRemaining===0 → GameScene.onWaveComplete()
    → n<5: 过渡 → startWave(n+1)
    → n===5: onVictory()
```

## GameScene.create() 初始化顺序

```
1. createBackground()  → 三层视差背景 (远/中/近 + 光点)
2. createGround()      → 地面层
3. combatSystem        → new CombatSystem(this)
4. enemies             → []
5. player              → new Player(this, 150, LANE_LIST[1])
6. controls            → new GameControls(this)  [UI固定屏幕]
7. hud                 → new HUD(this)
8. camera setup        → setBounds + startFollow
9. wave timer          → 1.5s 后 startWave(1)
```

## 注意事项

- **UI 必须 setScrollFactor(0)**: GameControls 和 HUD 的所有元素都设置此属性
- **场景切换 fadeIn**: 从其他场景切换到 GameScene 时，须在 create() 开头调用 `this.cameras.main.fadeIn(300)`
- **index.html 分工**: 开发用 `/src/main.js`，构建产物用 `./assets/main-xxx.js`，部署时只提交 dist 到 gh-pages 分支
- **占位纹理**: 所有角色/特效贴图在 BootScene 中用 `make.graphics().generateTexture()` 动态生成
- **localStorage 键**: `dnf_user` (当前用户), `dnf_account_xxx` (账号密码)
- **Physics**: 全局 gravity.y=0，玩家跳跃时 `body.setAllowGravity(true)`，落地后关闭
