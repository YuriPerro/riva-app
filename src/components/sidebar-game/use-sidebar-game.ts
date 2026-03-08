import { useRef, useState, useEffect, useCallback } from 'react';
import type { GameState, Player, Enemy, Bullet, Particle, GameConfig, LevelConfig, GameSave, EnemyType } from './types';

const GAME_CONFIG = {
  canvasWidth: 168,
  canvasHeight: 300,
  playerWidth: 16,
  playerHeight: 10,
  playerSpeed: 3,
  bulletWidth: 2,
  bulletHeight: 6,
  bulletSpeed: 4,
  enemyWidth: 12,
  enemyHeight: 8,
  enemyPaddingX: 6,
  enemyPaddingY: 6,
  enemyOffsetX: 18,
  enemyOffsetY: 10,
  enemyDropY: 8,
  scorePerEnemy: 10,
  shootCooldownMs: 300,
  saveKey: 'riva-game-save',
} as const satisfies GameConfig;

const LEVELS: LevelConfig[] = [
  { level: 1, enemyRows: 3, enemyCols: 4, enemySpeedX: 0.6, enemyTypes: ['basic'], scoreMultiplier: 1 },
  { level: 2, enemyRows: 3, enemyCols: 5, enemySpeedX: 0.8, enemyTypes: ['basic', 'fast'], scoreMultiplier: 1.2 },
  {
    level: 3,
    enemyRows: 4,
    enemyCols: 5,
    enemySpeedX: 1.0,
    enemyTypes: ['basic', 'fast', 'tank'],
    scoreMultiplier: 1.5,
  },
  { level: 4, enemyRows: 4, enemyCols: 6, enemySpeedX: 1.2, enemyTypes: ['fast', 'tank'], scoreMultiplier: 1.8 },
  {
    level: 5,
    enemyRows: 5,
    enemyCols: 6,
    enemySpeedX: 1.4,
    enemyTypes: ['basic', 'fast', 'tank', 'boss'],
    scoreMultiplier: 2.0,
  },
];

const ENEMY_HP: Record<EnemyType, number> = { basic: 1, fast: 1, tank: 2, boss: 3 };

function getLevelConfig(level: number): { config: LevelConfig; speedBonus: number } {
  const loopIndex = (level - 1) % LEVELS.length;
  const loopCount = Math.floor((level - 1) / LEVELS.length);
  return { config: LEVELS[loopIndex], speedBonus: loopCount * 0.2 };
}

function createEnemies(level: number): Enemy[] {
  const { config } = getLevelConfig(level);
  const enemies: Enemy[] = [];
  for (let row = 0; row < config.enemyRows; row++) {
    const typeIndex = row % config.enemyTypes.length;
    const enemyType = config.enemyTypes[typeIndex];
    for (let col = 0; col < config.enemyCols; col++) {
      enemies.push({
        x: GAME_CONFIG.enemyOffsetX + col * (GAME_CONFIG.enemyWidth + GAME_CONFIG.enemyPaddingX),
        y: GAME_CONFIG.enemyOffsetY + row * (GAME_CONFIG.enemyHeight + GAME_CONFIG.enemyPaddingY),
        width: GAME_CONFIG.enemyWidth,
        height: GAME_CONFIG.enemyHeight,
        alive: true,
        enemyType,
        hp: ENEMY_HP[enemyType],
        flashFrames: 0,
      });
    }
  }
  return enemies;
}

function createPlayer(): Player {
  return {
    x: GAME_CONFIG.canvasWidth / 2 - GAME_CONFIG.playerWidth / 2,
    y: GAME_CONFIG.canvasHeight - GAME_CONFIG.playerHeight - 4,
    width: GAME_CONFIG.playerWidth,
    height: GAME_CONFIG.playerHeight,
  };
}

function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(GAME_CONFIG.saveKey);
    if (raw) {
      const parsed = JSON.parse(raw) as GameSave;
      return { highScore: parsed.highScore || 0, bestLevel: parsed.bestLevel || 0 };
    }
  } catch {
    /* noop */
  }
  return { highScore: 0, bestLevel: 0 };
}

function persistSave(save: GameSave) {
  localStorage.setItem(GAME_CONFIG.saveKey, JSON.stringify(save));
}

function getCanvasColors(canvas: HTMLCanvasElement) {
  const styles = getComputedStyle(canvas);
  return {
    accent: styles.getPropertyValue('--color-accent').trim(),
    fg: styles.getPropertyValue('--color-fg').trim(),
    surface: styles.getPropertyValue('--color-surface').trim(),
    fgMuted: styles.getPropertyValue('--color-fg-muted').trim(),
    error: styles.getPropertyValue('--color-error').trim(),
    success: styles.getPropertyValue('--color-success').trim(),
    warning: styles.getPropertyValue('--color-warning').trim(),
  };
}

type CanvasColors = ReturnType<typeof getCanvasColors>;

function getEnemyColor(enemyType: EnemyType, colors: CanvasColors): string {
  const colorMap: Record<EnemyType, string> = {
    basic: colors.error,
    fast: colors.warning,
    tank: colors.accent,
    boss: colors.success,
  };
  return colorMap[enemyType];
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, colors: CanvasColors) {
  const isFlashing = enemy.flashFrames > 0;
  const color = isFlashing ? colors.fg : getEnemyColor(enemy.enemyType, colors);
  ctx.fillStyle = color;

  const { x, y, width: w, height: h } = enemy;

  switch (enemy.enemyType) {
    case 'basic':
      ctx.fillRect(x, y, w, h);
      ctx.fillRect(x + 1, y - 2, 2, 2);
      ctx.fillRect(x + w - 3, y - 2, 2, 2);
      break;

    case 'fast':
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y - 1);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x, y + h / 2);
      ctx.closePath();
      ctx.fill();
      break;

    case 'tank':
      ctx.fillRect(x - 1, y, w + 2, h);
      ctx.fillRect(x - 2, y + 2, 1, h - 4);
      ctx.fillRect(x + w + 1, y + 2, 1, h - 4);
      ctx.fillRect(x + 2, y - 1, w - 4, 1);
      break;

    case 'boss':
      ctx.fillRect(x, y, w, h);
      ctx.fillRect(x + 1, y - 2, 2, 2);
      ctx.fillRect(x + w - 3, y - 2, 2, 2);
      ctx.fillRect(x + w / 2 - 1, y - 3, 2, 3);
      ctx.fillRect(x - 1, y + 1, 1, h - 2);
      ctx.fillRect(x + w, y + 1, 1, h - 2);
      break;
  }
}

function spawnParticles(x: number, y: number, count: number, color: string): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const life = 15 + Math.random() * 10;
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: -2 + Math.random() * 3,
      life,
      maxLife: life,
      color,
      size: 1.5 + Math.random() * 1.5,
    });
  }
  return particles;
}

function rectsCollide(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function useSidebarGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameSave, setGameSave] = useState<GameSave>(loadSave);

  const playerRef = useRef<Player>(createPlayer());
  const enemiesRef = useRef<Enemy[]>(createEnemies(1));
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const enemyDirRef = useRef<1 | -1>(1);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const rafRef = useRef<number>(0);
  const lastShootRef = useRef(0);

  const resetGame = useCallback(() => {
    playerRef.current = createPlayer();
    enemiesRef.current = createEnemies(1);
    bulletsRef.current = [];
    particlesRef.current = [];
    enemyDirRef.current = 1;
    scoreRef.current = 0;
    levelRef.current = 1;
    setScore(0);
    setCurrentLevel(1);
  }, []);

  const handleNewGame = useCallback(() => {
    resetGame();
    setGameState('playing');
    canvasRef.current?.focus();
  }, [resetGame]);

  const endGame = useCallback(() => {
    setGameState('gameover');
    const finalScore = scoreRef.current;
    const finalLevel = levelRef.current;
    setGameSave((prev) => {
      const next: GameSave = {
        highScore: Math.max(prev.highScore, finalScore),
        bestLevel: Math.max(prev.bestLevel, finalLevel),
      };
      persistSave(next);
      return next;
    });
  }, []);

  const advanceLevel = useCallback(() => {
    const nextLevel = levelRef.current + 1;
    levelRef.current = nextLevel;
    setCurrentLevel(nextLevel);
    playerRef.current = createPlayer();
    enemiesRef.current = createEnemies(nextLevel);
    bulletsRef.current = [];
    enemyDirRef.current = 1;
  }, []);

  const shoot = useCallback(() => {
    const now = Date.now();
    if (now - lastShootRef.current < GAME_CONFIG.shootCooldownMs) return;
    lastShootRef.current = now;
    const player = playerRef.current;
    bulletsRef.current.push({
      x: player.x + player.width / 2 - GAME_CONFIG.bulletWidth / 2,
      y: player.y - GAME_CONFIG.bulletHeight,
      width: GAME_CONFIG.bulletWidth,
      height: GAME_CONFIG.bulletHeight,
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLCanvasElement>) => {
      if (gameState !== 'playing') return;
      keysRef.current.add(e.key);
      if (e.key === ' ') {
        e.preventDefault();
        shoot();
      }
    },
    [gameState, shoot],
  );

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>) => {
    keysRef.current.delete(e.key);
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (gameState === 'playing') {
      shoot();
    }
  }, [gameState, shoot]);


  useEffect(() => {
    if (gameState === 'won') {
      const timeout = setTimeout(() => {
        advanceLevel();
        setGameState('playing');
      }, 1000);
      return () => clearTimeout(timeout);
    }

    if (gameState !== 'playing') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let colors = getCanvasColors(canvas);

    const observer = new MutationObserver(() => {
      colors = getCanvasColors(canvas);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const { config, speedBonus } = getLevelConfig(levelRef.current);
    const levelSpeed = config.enemySpeedX + speedBonus;

    function gameLoop() {
      const keys = keysRef.current;
      const player = playerRef.current;
      const enemies = enemiesRef.current;
      const bullets = bulletsRef.current;
      const particles = particlesRef.current;

      if (keys.has('ArrowLeft') || keys.has('a')) {
        player.x = Math.max(0, player.x - GAME_CONFIG.playerSpeed);
      }
      if (keys.has('ArrowRight') || keys.has('d')) {
        player.x = Math.min(GAME_CONFIG.canvasWidth - player.width, player.x + GAME_CONFIG.playerSpeed);
      }

      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= GAME_CONFIG.bulletSpeed;
        if (bullets[i].y + bullets[i].height < 0) {
          bullets.splice(i, 1);
        }
      }

      let shouldReverse = false;
      const aliveEnemies = enemies.filter((e) => e.alive);

      for (const enemy of aliveEnemies) {
        const speedMult = enemy.enemyType === 'fast' ? 1.5 : 1;
        enemy.x += levelSpeed * speedMult * enemyDirRef.current;
        if (enemy.x + enemy.width >= GAME_CONFIG.canvasWidth || enemy.x <= 0) {
          shouldReverse = true;
        }
      }

      if (shouldReverse) {
        enemyDirRef.current = (enemyDirRef.current * -1) as 1 | -1;
        for (const enemy of aliveEnemies) {
          enemy.y += GAME_CONFIG.enemyDropY;
        }
      }

      for (const enemy of aliveEnemies) {
        if (enemy.flashFrames > 0) enemy.flashFrames--;
      }

      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          if (rectsCollide(bullets[bi], enemy)) {
            enemy.hp--;
            bullets.splice(bi, 1);
            const cx = enemy.x + enemy.width / 2;
            const cy = enemy.y + enemy.height / 2;
            const color = getEnemyColor(enemy.enemyType, colors);

            if (enemy.hp <= 0) {
              enemy.alive = false;
              const earned = Math.round(GAME_CONFIG.scorePerEnemy * config.scoreMultiplier);
              scoreRef.current += earned;
              setScore(scoreRef.current);
              particles.push(...spawnParticles(cx, cy, 7, color));
            } else {
              enemy.flashFrames = 3;
              particles.push(...spawnParticles(cx, cy, 3, color));
            }
            break;
          }
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
      }

      const allDead = enemies.every((e) => !e.alive);
      if (allDead) {
        setGameState('won');
        return;
      }

      for (const enemy of aliveEnemies) {
        if (rectsCollide(enemy, player)) {
          endGame();
          return;
        }
        if (enemy.y + enemy.height >= player.y) {
          endGame();
          return;
        }
      }

      ctx!.fillStyle = colors.surface;
      ctx!.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);

      ctx!.fillStyle = colors.accent;
      ctx!.fillRect(player.x, player.y, player.width, player.height);
      const tipX = player.x + player.width / 2;
      const tipY = player.y - 4;
      ctx!.beginPath();
      ctx!.moveTo(tipX, tipY);
      ctx!.lineTo(player.x, player.y);
      ctx!.lineTo(player.x + player.width, player.y);
      ctx!.closePath();
      ctx!.fill();

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        drawEnemy(ctx!, enemy, colors);
      }

      ctx!.fillStyle = colors.fg;
      for (const bullet of bullets) {
        ctx!.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      }

      for (const p of particles) {
        ctx!.globalAlpha = p.life / p.maxLife;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      ctx!.fillStyle = colors.fgMuted;
      ctx!.font = '10px Geist, sans-serif';
      ctx!.textAlign = 'left';
      ctx!.fillText(`Lv.${levelRef.current}`, 4, 12);
      ctx!.textAlign = 'right';
      ctx!.fillText(`${scoreRef.current}`, GAME_CONFIG.canvasWidth - 4, 12);

      rafRef.current = requestAnimationFrame(gameLoop);
    }

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [gameState, endGame, advanceLevel]);

  return {
    canvasRef,
    gameState,
    score,
    currentLevel,
    gameSave,
    handleNewGame,
    handleKeyDown,
    handleKeyUp,
    handleCanvasClick,
    canvasWidth: GAME_CONFIG.canvasWidth,
    canvasHeight: GAME_CONFIG.canvasHeight,
  };
}
