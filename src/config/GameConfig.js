/**
 * 游戏全局配置
 * DNF手游风格横版动作游戏
 */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

// 纵向通道（三条线）
export const LANES = {
  TOP: 160,
  MIDDLE: 320,
  BOTTOM: 480,
};

export const LANE_LIST = [LANES.TOP, LANES.MIDDLE, LANES.BOTTOM];

// 获取最近的通道
export function getClosestLane(y) {
  let closest = LANES.MIDDLE;
  let minDist = Infinity;
  for (const lane of LANE_LIST) {
    const dist = Math.abs(y - lane);
    if (dist < minDist) {
      minDist = dist;
      closest = lane;
    }
  }
  return closest;
}

// 玩家配置
export const PLAYER_CONFIG = {
  SPEED: 200,
  MAX_HP: 100,
  ATTACK_DAMAGE: 15,
  ATTACK_RANGE: 80,
  ATTACK_COOLDOWN: 400,    // ms
  INVINCIBLE_TIME: 500,    // 受伤无敌时间 ms
  WIDTH: 40,
  HEIGHT: 64,
};

// 敌人配置
export const ENEMY_TYPES = {
  BASIC: {
    name: '哥布林',
    speed: 60,
    hp: 40,
    damage: 8,
    attackRange: 50,
    chaseRange: 200,
    attackCooldown: 1200,
    width: 36,
    height: 48,
    color: 0xe74c3c,
    score: 100,
  },
  HEAVY: {
    name: '牛头兵',
    speed: 40,
    hp: 80,
    damage: 15,
    attackRange: 60,
    chaseRange: 250,
    attackCooldown: 2000,
    width: 48,
    height: 64,
    color: 0xe67e22,
    score: 200,
  },
  FAST: {
    name: '猫妖',
    speed: 100,
    hp: 25,
    damage: 6,
    attackRange: 45,
    chaseRange: 300,
    attackCooldown: 800,
    width: 32,
    height: 40,
    color: 0x9b59b6,
    score: 150,
  },
};

// 游戏世界配置
export const WORLD_CONFIG = {
  GROUND_Y: 560,
  SCROLL_SPEED: 1,
  SPAWN_INTERVAL_MIN: 2000,
  SPAWN_INTERVAL_MAX: 4000,
};

// 颜色主题
export const COLORS = {
  BG_DARK: 0x1a1a2e,
  BG_MID: 0x16213e,
  BG_LIGHT: 0x0f3460,
  PLAYER: 0x3498db,
  PLAYER_ATTACK: 0xff6b6b,
  HEALTH_GREEN: 0x2ecc71,
  HEALTH_RED: 0xe74c3c,
  HEALTH_BG: 0x2c3e50,
  UI_GOLD: 0xf39c12,
  DAMAGE_TEXT: 0xff0000,
};
