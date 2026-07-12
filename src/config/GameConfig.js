export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

// 四通道（DNF 手游风格）
export const LANES = { TOP: 130, MID_TOP: 260, MID_BOT: 390, BOTTOM: 510 };
export const LANE_LIST = [LANES.TOP, LANES.MID_TOP, LANES.MID_BOT, LANES.BOTTOM];

export function getClosestLane(y) {
  let closest = LANES.MID_TOP;
  let minDist = Infinity;
  for (const lane of LANE_LIST) {
    const dist = Math.abs(y - lane);
    if (dist < minDist) { minDist = dist; closest = lane; }
  }
  return closest;
}

// 玩家
export const PLAYER_CONFIG = {
  SPEED: 220,
  MAX_HP: 200,
  MAX_MP: 100,
  ATTACK_DAMAGE: 20,
  ATTACK_RANGE: 70,
  ATTACK_COOLDOWN: 350,
  INVINCIBLE_TIME: 600,
  WIDTH: 40,
  HEIGHT: 64,
  DASH_SPEED: 500,
  DASH_DURATION: 180,
  DASH_COOLDOWN: 1500,
  DASH_DISTANCE: 120,
  JUMP_VELOCITY: -350,
  JUMP_COOLDOWN: 300,
};

// 技能
export const SKILLS = [
  {
    id: 'slash',
    name: '上挑',
    icon: '↑',
    key: 'Q',
    damage: 30,
    range: 90,
    cooldown: 2000,
    type: 'melee',
    knockup: true,
  },
  {
    id: 'wave',
    name: '地裂波',
    icon: '~',
    key: 'E',
    damage: 25,
    range: 200,
    cooldown: 4000,
    type: 'projectile',
    speed: 400,
  },
  {
    id: 'spin',
    name: '旋风斩',
    icon: '○',
    key: 'R',
    damage: 12,
    range: 100,
    cooldown: 6000,
    type: 'aoe',
    hits: 4,
    duration: 600,
  },
  {
    id: 'burst',
    name: '崩山击',
    icon: '▼',
    key: 'F',
    damage: 45,
    range: 120,
    cooldown: 8000,
    type: 'charge',
    jumpDist: 100,
    aoeRange: 80,
  },
];

// 敌人
export const ENEMY_TYPES = {
  BASIC:   { name:'哥布林', speed:60, hp:40, damage:8, atkRange:50, chaseRange:200, atkCD:1200, w:36, h:48, color:0xe74c3c, score:100 },
  HEAVY:   { name:'牛头兵', speed:40, hp:90, damage:18, atkRange:65, chaseRange:250, atkCD:2000, w:48, h:64, color:0xe67e22, score:200 },
  FAST:    { name:'猫妖',   speed:100,hp:30, damage:7,  atkRange:45, chaseRange:300, atkCD:800,  w:32, h:40, color:0x9b59b6, score:150 },
  ELITE:   { name:'铠甲兵', speed:50, hp:150,damage:22, atkRange:70, chaseRange:280, atkCD:1500, w:44, h:56, color:0xc0392b, score:500 },
  BOSS:    { name:'牛头王', speed:30, hp:500,damage:30, atkRange:90, chaseRange:350, atkCD:2500, w:64, h:80, color:0x8e44ad, score:2000 },
};

// 波次系统
export const WAVE_CONFIG = {
  MAX_WAVES: 5,
  PREP_TIME: 2500,
  ENEMIES_PER_WAVE: [3, 4, 5, 6, 1], // 最后一波 1 是 Boss
  WAVE_ENEMY_TABLE: [
    [{ type:'BASIC', count:3 }],
    [{ type:'BASIC', count:2 }, { type:'FAST', count:2 }],
    [{ type:'BASIC', count:2 }, { type:'HEAVY', count:2 }, { type:'FAST', count:1 }],
    [{ type:'HEAVY', count:2 }, { type:'ELITE', count:2 }, { type:'FAST', count:2 }],
    [{ type:'BOSS', count:1 }, { type:'ELITE', count:1 }],
  ],
};

// 连击评分
export const COMBO_GRADES = [
  { min:0,  grade:'F', color:'#888888' },
  { min:5,  grade:'D', color:'#aaaaaa' },
  { min:12, grade:'C', color:'#4ecdc4' },
  { min:25, grade:'B', color:'#2ecc71' },
  { min:40, grade:'A', color:'#3498db' },
  { min:60, grade:'S', color:'#f39c12' },
  { min:85, grade:'SS', color:'#e74c3c' },
  { min:120,grade:'SSS',color:'#ff6b6b' },
];

export const COLORS = {
  BG_DARK:0x1a1a2e, BG_MID:0x16213e, BG_LIGHT:0x0f3460,
  PLAYER:0x3498db, PLAYER_ATTACK:0xff6b6b,
  HEALTH_GREEN:0x2ecc71, HEALTH_RED:0xe74c3c, HEALTH_BG:0x2c3e50,
  MP_BLUE:0x3498db,
  UI_GOLD:0xf39c12,
};
