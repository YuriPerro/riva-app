import { useRef, useState, useEffect, useCallback } from 'react';
import type { GameState, Player, Enemy, Bullet, GameConfig } from './types';

const GAME_CONFIG = {
  canvasWidth: 168,
  canvasHeight: 180,
  playerWidth: 16,
  playerHeight: 10,
  playerSpeed: 3,
  bulletWidth: 2,
  bulletHeight: 6,
  bulletSpeed: 4,
  enemyWidth: 12,
  enemyHeight: 8,
  enemyRows: 3,
  enemyCols: 4,
  enemyPaddingX: 6,
  enemyPaddingY: 6,
  enemyOffsetX: 18,
  enemyOffsetY: 10,
  enemySpeedX: 0.6,
  enemyDropY: 8,
  scorePerEnemy: 10,
  shootCooldownMs: 300,
  highScoreKey: 'forge-game-highscore',
} as const satisfies GameConfig;

function createEnemies(): Enemy[] {
  const enemies: Enemy[] = [];
  for (let row = 0; row < GAME_CONFIG.enemyRows; row++) {
    for (let col = 0; col < GAME_CONFIG.enemyCols; col++) {
      enemies.push({
        x: GAME_CONFIG.enemyOffsetX + col * (GAME_CONFIG.enemyWidth + GAME_CONFIG.enemyPaddingX),
        y: GAME_CONFIG.enemyOffsetY + row * (GAME_CONFIG.enemyHeight + GAME_CONFIG.enemyPaddingY),
        width: GAME_CONFIG.enemyWidth,
        height: GAME_CONFIG.enemyHeight,
        alive: true,
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

function getCanvasColors(canvas: HTMLCanvasElement) {
  const styles = getComputedStyle(canvas);
  return {
    accent: styles.getPropertyValue('--color-accent').trim(),
    fg: styles.getPropertyValue('--color-fg').trim(),
    surface: styles.getPropertyValue('--color-surface').trim(),
    fgMuted: styles.getPropertyValue('--color-fg-muted').trim(),
    error: styles.getPropertyValue('--color-error').trim(),
    success: styles.getPropertyValue('--color-success').trim(),
  };
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
  const [highScore, setHighScore] = useState(() => {
    const stored = localStorage.getItem(GAME_CONFIG.highScoreKey);
    return stored ? parseInt(stored, 10) : 0;
  });

  const playerRef = useRef<Player>(createPlayer());
  const enemiesRef = useRef<Enemy[]>(createEnemies());
  const bulletsRef = useRef<Bullet[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const enemyDirRef = useRef<1 | -1>(1);
  const scoreRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastShootRef = useRef(0);

  const resetGame = useCallback(() => {
    playerRef.current = createPlayer();
    enemiesRef.current = createEnemies();
    bulletsRef.current = [];
    enemyDirRef.current = 1;
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const handleNewGame = useCallback(() => {
    resetGame();
    setGameState('playing');
    canvasRef.current?.focus();
  }, [resetGame]);

  const endGame = useCallback(() => {
    setGameState('gameover');
    const finalScore = scoreRef.current;
    setHighScore((prev) => {
      const newHigh = Math.max(prev, finalScore);
      localStorage.setItem(GAME_CONFIG.highScoreKey, String(newHigh));
      return newHigh;
    });
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
    if (gameState !== 'playing') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = getCanvasColors(canvas);

    function gameLoop() {
      const keys = keysRef.current;
      const player = playerRef.current;
      const enemies = enemiesRef.current;
      const bullets = bulletsRef.current;

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
        enemy.x += GAME_CONFIG.enemySpeedX * enemyDirRef.current;
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

      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          if (rectsCollide(bullets[bi], enemy)) {
            enemy.alive = false;
            bullets.splice(bi, 1);
            scoreRef.current += GAME_CONFIG.scorePerEnemy;
            setScore(scoreRef.current);
            break;
          }
        }
      }

      const allDead = enemies.every((e) => !e.alive);
      if (allDead) {
        endGame();
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

      ctx!.clearRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);

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

      ctx!.fillStyle = colors.error;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        ctx!.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx!.fillRect(enemy.x + 1, enemy.y - 2, 2, 2);
        ctx!.fillRect(enemy.x + enemy.width - 3, enemy.y - 2, 2, 2);
      }

      ctx!.fillStyle = colors.fg;
      for (const bullet of bullets) {
        ctx!.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      }

      ctx!.fillStyle = colors.fgMuted;
      ctx!.font = '10px Geist, sans-serif';
      ctx!.textAlign = 'right';
      ctx!.fillText(`${scoreRef.current}`, GAME_CONFIG.canvasWidth - 4, 12);

      rafRef.current = requestAnimationFrame(gameLoop);
    }

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameState, endGame]);

  return {
    canvasRef,
    gameState,
    score,
    highScore,
    handleNewGame,
    handleKeyDown,
    handleKeyUp,
    handleCanvasClick,
    canvasWidth: GAME_CONFIG.canvasWidth,
    canvasHeight: GAME_CONFIG.canvasHeight,
  };
}
