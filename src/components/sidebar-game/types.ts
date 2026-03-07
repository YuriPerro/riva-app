export type GameState = 'idle' | 'playing' | 'gameover';

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
};

export type Bullet = {
  x: number;
  y: number;
  width: number;
  height: number;
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
  enemyRows: number;
  enemyCols: number;
  enemyPaddingX: number;
  enemyPaddingY: number;
  enemyOffsetX: number;
  enemyOffsetY: number;
  enemySpeedX: number;
  enemyDropY: number;
  scorePerEnemy: number;
  shootCooldownMs: number;
  highScoreKey: string;
};
