export type GameState = 'idle' | 'playing' | 'gameover' | 'won' | 'victory';

export type EnemyType = 'basic' | 'fast' | 'tank' | 'shooter';

export type Player = {
  x: number;
  y: number;
  width: number;
  height: number;
  shielded: boolean;
};

export type Enemy = {
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  enemyType: EnemyType;
  hp: number;
  flashFrames: number;
  shootTimer: number;
};

export type Bullet = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EnemyBullet = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
};

export type PowerUpType = 'rapidFire' | 'spreadShot' | 'shield' | 'nuke';

export type PowerUpDrop = {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PowerUpType;
  pulse: number;
};

export type ActivePowerUp = {
  type: 'rapidFire' | 'spreadShot';
  expiresAt: number;
} | null;

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

export type BossPhase = 1 | 2 | 3;

export type Boss = {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  phase: BossPhase;
  shootTimer: number;
  ghostTimer: number;
  ghostActive: boolean;
  teleportTimer: number;
  diveState: 'none' | 'down' | 'up';
  diveY: number;
  dir: 1 | -1;
  flashFrames: number;
};

export type LevelConfig = {
  level: number;
  type: 'standard' | 'boss';
  enemyRows: number;
  enemyCols: number;
  enemySpeedX: number;
  enemyTypes: EnemyType[];
  scoreMultiplier: number;
  dropRate: number;
  shooterFireRateMs: number;
};

export type GameSave = {
  highScore: number;
  bestLevel: number;
  savedLevel: number;
  savedScore: number;
};

export type GameConfig = {
  canvasWidth: number;
  canvasHeight: number;
  playerWidth: number;
  playerHeight: number;
  playerSpeed: number;
  bulletWidth: number;
  bulletHeight: number;
  bulletSpeed: number;
  enemyBulletWidth: number;
  enemyBulletHeight: number;
  enemyBulletSpeed: number;
  enemyWidth: number;
  enemyHeight: number;
  enemyPaddingX: number;
  enemyPaddingY: number;
  enemyOffsetX: number;
  enemyOffsetY: number;
  enemyDropY: number;
  scorePerEnemy: number;
  shootCooldownMs: number;
  powerUpSize: number;
  powerUpSpeed: number;
  powerUpDuration: number;
  bossWidth: number;
  bossHeight: number;
  saveKey: string;
};
