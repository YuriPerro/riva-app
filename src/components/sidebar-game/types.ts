export type GameState = 'idle' | 'playing' | 'gameover' | 'won';

export type EnemyType = 'basic' | 'fast' | 'tank' | 'boss';

export type Player = {
  x: number;
  y: number;
  width: number;
  height: number;
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
};

export type Bullet = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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

export type LevelConfig = {
  level: number;
  enemyRows: number;
  enemyCols: number;
  enemySpeedX: number;
  enemyTypes: EnemyType[];
  scoreMultiplier: number;
};

export type GameSave = {
  highScore: number;
  bestLevel: number;
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
  enemyWidth: number;
  enemyHeight: number;
  enemyPaddingX: number;
  enemyPaddingY: number;
  enemyOffsetX: number;
  enemyOffsetY: number;
  enemyDropY: number;
  scorePerEnemy: number;
  shootCooldownMs: number;
  saveKey: string;
};
