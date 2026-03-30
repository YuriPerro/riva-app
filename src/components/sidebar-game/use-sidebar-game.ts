import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  GameState,
  Player,
  Enemy,
  Bullet,
  EnemyBullet,
  Particle,
  GameConfig,
  LevelConfig,
  GameSave,
  EnemyType,
  PowerUpType,
  PowerUpDrop,
  ActivePowerUp,
  Boss,
  BossPhase,
} from './types';

const CFG = {
  canvasWidth: 168,
  canvasHeight: 300,
  playerWidth: 16,
  playerHeight: 10,
  playerSpeed: 3,
  bulletWidth: 2,
  bulletHeight: 6,
  bulletSpeed: 4,
  enemyBulletWidth: 2,
  enemyBulletHeight: 5,
  enemyBulletSpeed: 2,
  enemyWidth: 12,
  enemyHeight: 8,
  enemyPaddingX: 6,
  enemyPaddingY: 6,
  enemyOffsetX: 18,
  enemyOffsetY: 10,
  enemyDropY: 8,
  scorePerEnemy: 10,
  shootCooldownMs: 300,
  powerUpSize: 6,
  powerUpSpeed: 1.0,
  powerUpDuration: 8000,
  bossWidth: 28,
  bossHeight: 16,
  saveKey: 'riva-game-save',
} as const satisfies GameConfig;

const LEVELS: LevelConfig[] = [
  { level: 1, type: 'standard', enemyRows: 3, enemyCols: 4, enemySpeedX: 0.5, enemyTypes: ['basic'], scoreMultiplier: 1, dropRate: 0.08, shooterFireRateMs: 0 },
  { level: 2, type: 'standard', enemyRows: 3, enemyCols: 5, enemySpeedX: 0.6, enemyTypes: ['basic', 'fast', 'basic'], scoreMultiplier: 1.2, dropRate: 0.1, shooterFireRateMs: 0 },
  { level: 3, type: 'standard', enemyRows: 3, enemyCols: 5, enemySpeedX: 0.7, enemyTypes: ['tank', 'basic', 'basic'], scoreMultiplier: 1.4, dropRate: 0.1, shooterFireRateMs: 0 },
  { level: 4, type: 'standard', enemyRows: 4, enemyCols: 5, enemySpeedX: 0.7, enemyTypes: ['basic', 'shooter', 'basic', 'shooter'], scoreMultiplier: 1.6, dropRate: 0.12, shooterFireRateMs: 4000 },
  { level: 5, type: 'standard', enemyRows: 4, enemyCols: 6, enemySpeedX: 0.8, enemyTypes: ['tank', 'tank', 'basic', 'fast'], scoreMultiplier: 1.8, dropRate: 0.12, shooterFireRateMs: 0 },
  { level: 6, type: 'standard', enemyRows: 4, enemyCols: 6, enemySpeedX: 0.9, enemyTypes: ['shooter', 'fast', 'shooter', 'fast'], scoreMultiplier: 2.0, dropRate: 0.14, shooterFireRateMs: 3500 },
  { level: 7, type: 'standard', enemyRows: 5, enemyCols: 5, enemySpeedX: 1.0, enemyTypes: ['fast', 'fast', 'fast', 'basic', 'shooter'], scoreMultiplier: 2.3, dropRate: 0.14, shooterFireRateMs: 3500 },
  { level: 8, type: 'standard', enemyRows: 5, enemyCols: 6, enemySpeedX: 0.9, enemyTypes: ['tank', 'shooter', 'tank', 'shooter', 'basic'], scoreMultiplier: 2.6, dropRate: 0.15, shooterFireRateMs: 3000 },
  { level: 9, type: 'standard', enemyRows: 5, enemyCols: 7, enemySpeedX: 1.1, enemyTypes: ['shooter', 'tank', 'fast', 'shooter', 'tank'], scoreMultiplier: 3.0, dropRate: 0.15, shooterFireRateMs: 2800 },
  { level: 10, type: 'boss', enemyRows: 0, enemyCols: 0, enemySpeedX: 0, enemyTypes: [], scoreMultiplier: 5.0, dropRate: 0, shooterFireRateMs: 0 },
];

const ENEMY_HP: Record<EnemyType, number> = { basic: 1, fast: 1, tank: 2, shooter: 2 };

const POWER_UP_WEIGHTS: { type: PowerUpType; weight: number }[] = [
  { type: 'rapidFire', weight: 40 },
  { type: 'spreadShot', weight: 30 },
  { type: 'shield', weight: 20 },
  { type: 'nuke', weight: 10 },
];

const TOTAL_WEIGHT = POWER_UP_WEIGHTS.reduce((s, p) => s + p.weight, 0);

function pickPowerUpType(): PowerUpType {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const p of POWER_UP_WEIGHTS) {
    roll -= p.weight;
    if (roll <= 0) return p.type;
  }
  return 'rapidFire';
}

function getLevelConfig(level: number): { config: LevelConfig; speedBonus: number; hpBonus: number; cycle: number } {
  const isBossLevel = level % 10 === 0;
  if (isBossLevel) {
    const cycle = Math.floor((level - 1) / 10);
    return { config: LEVELS[9], speedBonus: 0, hpBonus: 0, cycle };
  }
  const loopIndex = (level - 1) % 10;
  const cycle = Math.floor((level - 1) / 10);
  return {
    config: LEVELS[loopIndex],
    speedBonus: cycle * 0.3,
    hpBonus: cycle,
    cycle,
  };
}

function createEnemies(level: number): Enemy[] {
  const { config, hpBonus } = getLevelConfig(level);
  if (config.type === 'boss') return [];
  const enemies: Enemy[] = [];
  for (let row = 0; row < config.enemyRows; row++) {
    const typeIndex = row % config.enemyTypes.length;
    const enemyType = config.enemyTypes[typeIndex];
    for (let col = 0; col < config.enemyCols; col++) {
      enemies.push({
        x: CFG.enemyOffsetX + col * (CFG.enemyWidth + CFG.enemyPaddingX),
        y: CFG.enemyOffsetY + row * (CFG.enemyHeight + CFG.enemyPaddingY),
        width: CFG.enemyWidth,
        height: CFG.enemyHeight,
        alive: true,
        enemyType,
        hp: ENEMY_HP[enemyType] + hpBonus,
        flashFrames: 0,
        shootTimer: 2000 + Math.random() * 3000,
      });
    }
  }
  return enemies;
}

function createBoss(level: number): Boss {
  const cycle = Math.floor((level - 1) / 10);
  return {
    x: CFG.canvasWidth / 2 - CFG.bossWidth / 2,
    y: 20,
    width: CFG.bossWidth,
    height: CFG.bossHeight,
    hp: 25 + cycle * 10,
    maxHp: 25 + cycle * 10,
    phase: 1,
    shootTimer: 2500,
    ghostTimer: 4000,
    ghostActive: false,
    teleportTimer: 5000,
    diveState: 'none',
    diveY: 20,
    dir: 1,
    flashFrames: 0,
  };
}

function getBossPhase(boss: Boss): BossPhase {
  const hpPct = boss.hp / boss.maxHp;
  if (hpPct > 0.64) return 1;
  if (hpPct > 0.32) return 2;
  return 3;
}

function createPlayer(): Player {
  return {
    x: CFG.canvasWidth / 2 - CFG.playerWidth / 2,
    y: CFG.canvasHeight - CFG.playerHeight - 4,
    width: CFG.playerWidth,
    height: CFG.playerHeight,
    shielded: false,
  };
}

function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(CFG.saveKey);
    if (raw) {
      const parsed = JSON.parse(raw) as GameSave;
      return {
        highScore: parsed.highScore || 0,
        bestLevel: parsed.bestLevel || 0,
        savedLevel: parsed.savedLevel || 0,
        savedScore: parsed.savedScore || 0,
      };
    }
  } catch { /* noop */ }
  return { highScore: 0, bestLevel: 0, savedLevel: 0, savedScore: 0 };
}

function persistSave(save: GameSave) {
  localStorage.setItem(CFG.saveKey, JSON.stringify(save));
}

function getCanvasColors(canvas: HTMLCanvasElement) {
  const s = getComputedStyle(canvas);
  return {
    accent: s.getPropertyValue('--color-accent').trim(),
    fg: s.getPropertyValue('--color-fg').trim(),
    surface: s.getPropertyValue('--color-surface').trim(),
    fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
    error: s.getPropertyValue('--color-error').trim(),
    success: s.getPropertyValue('--color-success').trim(),
    warning: s.getPropertyValue('--color-warning').trim(),
    info: s.getPropertyValue('--color-info').trim() || s.getPropertyValue('--color-accent').trim(),
  };
}

type CanvasColors = ReturnType<typeof getCanvasColors>;

function getEnemyColor(enemyType: EnemyType, colors: CanvasColors): string {
  const map: Record<EnemyType, string> = { basic: colors.error, fast: colors.warning, tank: colors.accent, shooter: colors.info };
  return map[enemyType];
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
    case 'shooter':
      ctx.fillRect(x, y, w, h);
      ctx.fillRect(x + 1, y - 2, 2, 2);
      ctx.fillRect(x + w - 3, y - 2, 2, 2);
      ctx.fillRect(x + w / 2 - 1, y + h, 2, 3);
      break;
  }
}

function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, colors: CanvasColors) {
  if (boss.ghostActive && Math.floor(Date.now() / 80) % 2 === 0) return;

  const phaseColor = boss.phase === 1 ? colors.accent : boss.phase === 2 ? colors.warning : colors.error;
  const color = boss.flashFrames > 0 ? colors.fg : phaseColor;
  ctx.fillStyle = color;
  const { x, y, width: w, height: h } = boss;

  ctx.fillRect(x + 2, y, w - 4, h);
  ctx.fillRect(x, y + 3, w, h - 6);
  ctx.fillRect(x + 4, y - 2, 3, 2);
  ctx.fillRect(x + w - 7, y - 2, 3, 2);
  ctx.fillRect(x + w / 2 - 1, y - 3, 2, 3);
  ctx.fillRect(x - 2, y + 4, 2, h - 8);
  ctx.fillRect(x + w, y + 4, 2, h - 8);

  if (!boss.ghostActive) {
    ctx.fillStyle = colors.fg;
    ctx.fillRect(x + w / 2 - 2, y + h / 2 - 2, 4, 4);
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, activePowerUp: ActivePowerUp, colors: CanvasColors) {
  const hasSpread = activePowerUp?.type === 'spreadShot';
  ctx.fillStyle = colors.accent;

  if (hasSpread) {
    ctx.fillRect(player.x - 2, player.y, player.width + 4, player.height);
    for (const offset of [-5, 0, 5]) {
      const tx = player.x + player.width / 2 + offset;
      ctx.beginPath();
      ctx.moveTo(tx, player.y - 3);
      ctx.lineTo(tx - 2, player.y);
      ctx.lineTo(tx + 2, player.y);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    ctx.fillRect(player.x, player.y, player.width, player.height);
    const tipX = player.x + player.width / 2;
    ctx.beginPath();
    ctx.moveTo(tipX, player.y - 4);
    ctx.lineTo(player.x, player.y);
    ctx.lineTo(player.x + player.width, player.y);
    ctx.closePath();
    ctx.fill();
  }

  if (player.shielded) {
    ctx.strokeStyle = colors.success;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2 + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (activePowerUp?.type === 'rapidFire') {
    ctx.strokeStyle = colors.warning;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 150) * 0.2;
    ctx.strokeRect(player.x - 1, player.y - 1, player.width + 2, player.height + 2);
    ctx.globalAlpha = 1;
  }
}

function drawPowerUp(ctx: CanvasRenderingContext2D, drop: PowerUpDrop, colors: CanvasColors) {
  const alpha = 0.6 + Math.sin(drop.pulse) * 0.4;
  ctx.globalAlpha = alpha;
  const { x, y, width: s } = drop;
  const colorMap: Record<PowerUpType, string> = { rapidFire: colors.warning, spreadShot: colors.info, shield: colors.success, nuke: colors.error };
  ctx.fillStyle = colorMap[drop.type];

  ctx.fillRect(x, y, s, s);

  ctx.fillStyle = colors.fg;
  const cx = x + s / 2;
  const cy = y + s / 2;

  switch (drop.type) {
    case 'rapidFire':
      ctx.fillRect(cx, y + 1, 1, s - 2);
      ctx.fillRect(cx - 1, cy, 3, 1);
      break;
    case 'spreadShot':
      ctx.fillRect(cx - 2, cy, 1, 1);
      ctx.fillRect(cx, cy - 1, 1, 1);
      ctx.fillRect(cx + 2, cy, 1, 1);
      break;
    case 'shield':
      ctx.clearRect(cx - 1, cy - 1, 2, 2);
      break;
    case 'nuke':
      ctx.fillRect(cx - 1, y + 1, 2, 1);
      ctx.fillRect(cx - 1, y + s - 2, 2, 1);
      ctx.fillRect(x + 1, cy, 1, 1);
      ctx.fillRect(x + s - 2, cy, 1, 1);
      break;
  }
  ctx.globalAlpha = 1;
}

function spawnParticles(x: number, y: number, count: number, color: string): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const life = 15 + Math.random() * 10;
    particles.push({ x, y, vx: (Math.random() - 0.5) * 4, vy: -2 + Math.random() * 3, life, maxLife: life, color, size: 1.5 + Math.random() * 1.5 });
  }
  return particles;
}

function rectsCollide(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function useSidebarGame() {
  const { t } = useTranslation('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameSave, setGameSave] = useState<GameSave>(loadSave);
  const [bossHp, setBossHp] = useState<{ hp: number; maxHp: number } | null>(null);
  const [activePowerUpState, setActivePowerUpState] = useState<ActivePowerUp>(null);

  const playerRef = useRef<Player>(createPlayer());
  const enemiesRef = useRef<Enemy[]>(createEnemies(1));
  const bulletsRef = useRef<Bullet[]>([]);
  const enemyBulletsRef = useRef<EnemyBullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUpDrop[]>([]);
  const activePowerUpRef = useRef<ActivePowerUp>(null);
  const bossRef = useRef<Boss | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const enemyDirRef = useRef<1 | -1>(1);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const rafRef = useRef<number>(0);
  const lastShootRef = useRef(0);
  const lastKillRef = useRef(0);
  const shakeRef = useRef(0);
  const tRef = useRef(t);
  tRef.current = t;

  const isBossLevel = useCallback((level: number) => level % 10 === 0, []);

  const initLevel = useCallback((level: number, keepScore?: boolean) => {
    playerRef.current = createPlayer();
    bulletsRef.current = [];
    enemyBulletsRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    activePowerUpRef.current = null;
    setActivePowerUpState(null);
    enemyDirRef.current = 1;
    shakeRef.current = 0;

    if (isBossLevel(level)) {
      enemiesRef.current = [];
      bossRef.current = createBoss(level);
      setBossHp({ hp: bossRef.current.hp, maxHp: bossRef.current.maxHp });
    } else {
      enemiesRef.current = createEnemies(level);
      bossRef.current = null;
      setBossHp(null);
    }

    if (!keepScore) {
      scoreRef.current = 0;
      setScore(0);
    }
    levelRef.current = level;
    setCurrentLevel(level);
  }, [isBossLevel]);

  const resetGame = useCallback(() => {
    initLevel(1);
  }, [initLevel]);

  const handleNewGame = useCallback(() => {
    resetGame();
    setGameSave((prev) => {
      const next: GameSave = { ...prev, savedLevel: 0, savedScore: 0 };
      persistSave(next);
      return next;
    });
    setGameState('playing');
    canvasRef.current?.focus();
  }, [resetGame]);

  const handleContinue = useCallback(() => {
    const level = gameSave.savedLevel || 1;
    initLevel(level);
    scoreRef.current = gameSave.savedScore || 0;
    setScore(scoreRef.current);
    setGameState('playing');
    canvasRef.current?.focus();
  }, [gameSave.savedLevel, gameSave.savedScore, initLevel]);

  const endGame = useCallback(() => {
    setGameState('gameover');
    const finalScore = scoreRef.current;
    const finalLevel = levelRef.current;
    setGameSave((prev) => {
      const next: GameSave = {
        highScore: Math.max(prev.highScore, finalScore),
        bestLevel: Math.max(prev.bestLevel, finalLevel),
        savedLevel: prev.savedLevel,
        savedScore: prev.savedScore,
      };
      persistSave(next);
      return next;
    });
  }, []);

  const advanceLevel = useCallback(() => {
    const nextLevel = levelRef.current + 1;
    const currentScore = scoreRef.current;
    initLevel(nextLevel, true);
    scoreRef.current = currentScore;
    setScore(currentScore);
    setGameSave((prev) => {
      const next: GameSave = {
        highScore: Math.max(prev.highScore, currentScore),
        bestLevel: Math.max(prev.bestLevel, nextLevel),
        savedLevel: nextLevel,
        savedScore: currentScore,
      };
      persistSave(next);
      return next;
    });
  }, [initLevel]);

  const shoot = useCallback(() => {
    const now = Date.now();
    const ap = activePowerUpRef.current;
    const cooldown = ap?.type === 'rapidFire' && now < ap.expiresAt ? CFG.shootCooldownMs * 0.5 : CFG.shootCooldownMs;
    if (now - lastShootRef.current < cooldown) return;
    lastShootRef.current = now;
    const player = playerRef.current;
    const cx = player.x + player.width / 2 - CFG.bulletWidth / 2;
    const by = player.y - CFG.bulletHeight;
    const bw = CFG.bulletWidth;
    const bh = CFG.bulletHeight;
    const hasSpread = ap?.type === 'spreadShot' && now < ap.expiresAt;

    if (hasSpread) {
      bulletsRef.current.push(
        { x: cx - 5, y: by, width: bw, height: bh },
        { x: cx, y: by, width: bw, height: bh },
        { x: cx + 5, y: by, width: bw, height: bh },
      );
    } else {
      bulletsRef.current.push({ x: cx, y: by, width: bw, height: bh });
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    keysRef.current.add(e.key);
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      shoot();
    }
  }, [gameState, shoot]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>) => {
    keysRef.current.delete(e.key);
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (gameState === 'playing') canvasRef.current?.focus();
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'won') {
      const timeout = setTimeout(() => {
        advanceLevel();
        setGameState('playing');
      }, 1200);
      return () => clearTimeout(timeout);
    }

    if (gameState === 'victory') {
      const timeout = setTimeout(() => {
        advanceLevel();
        setGameState('playing');
      }, 2500);
      return () => clearTimeout(timeout);
    }

    if (gameState !== 'playing') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxRaw = canvas.getContext('2d');
    if (!ctxRaw) return;
    const ctx = ctxRaw;

    let colors = getCanvasColors(canvas);
    const observer = new MutationObserver(() => { colors = getCanvasColors(canvas); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const { config, speedBonus } = getLevelConfig(levelRef.current);
    const levelSpeed = config.enemySpeedX + speedBonus;
    const TARGET_FRAME_MS = 1000 / 60;
    let lastTime = performance.now();

    function handlePlayerHit() {
      const player = playerRef.current;
      if (player.shielded) {
        player.shielded = false;
        shakeRef.current = 3;
        particlesRef.current.push(...spawnParticles(player.x + player.width / 2, player.y, 5, colors.success));
        return;
      }
      endGame();
    }

    function spawnDrop(x: number, y: number) {
      if (Math.random() > config.dropRate) return;
      powerUpsRef.current.push({
        x: x - CFG.powerUpSize / 2,
        y,
        width: CFG.powerUpSize,
        height: CFG.powerUpSize,
        type: pickPowerUpType(),
        pulse: 0,
      });
    }

    function applyPowerUp(type: PowerUpType) {
      const player = playerRef.current;
      if (type === 'nuke') {
        const enemies = enemiesRef.current;
        for (const e of enemies) {
          if (!e.alive) continue;
          e.alive = false;
          const cx = e.x + e.width / 2;
          const cy = e.y + e.height / 2;
          particlesRef.current.push(...spawnParticles(cx, cy, 5, getEnemyColor(e.enemyType, colors)));
          scoreRef.current += Math.round(CFG.scorePerEnemy * config.scoreMultiplier);
        }
        setScore(scoreRef.current);
        shakeRef.current = 5;
        return;
      }
      if (type === 'shield') {
        player.shielded = true;
        return;
      }
      const ap: ActivePowerUp = { type, expiresAt: Date.now() + CFG.powerUpDuration };
      activePowerUpRef.current = ap;
      setActivePowerUpState(ap);
    }

    function updateBoss(boss: Boss, dt: number) {
      const newPhase = getBossPhase(boss);
      if (newPhase !== boss.phase) {
        boss.phase = newPhase;
        shakeRef.current = 6;
        if (newPhase === 2) {
          powerUpsRef.current.push({ x: boss.x + boss.width / 2, y: boss.y + boss.height + 5, width: CFG.powerUpSize, height: CFG.powerUpSize, type: 'rapidFire', pulse: 0 });
        } else if (newPhase === 3) {
          powerUpsRef.current.push({ x: boss.x + boss.width / 2, y: boss.y + boss.height + 5, width: CFG.powerUpSize, height: CFG.powerUpSize, type: 'spreadShot', pulse: 0 });
        }
      }

      if (boss.flashFrames > 0) boss.flashFrames--;

      const phase = boss.phase;
      const speed = phase === 1 ? 0.8 : phase === 2 ? 1.3 : 1.5;

      if (boss.diveState === 'none') {
        boss.x += speed * boss.dir * dt;
        if (boss.x + boss.width >= CFG.canvasWidth - 2 || boss.x <= 2) {
          boss.dir = (boss.dir * -1) as 1 | -1;
        }
      }

      if (phase === 2) {
        boss.teleportTimer -= TARGET_FRAME_MS * dt;
        if (boss.teleportTimer <= 0) {
          boss.teleportTimer = 5000;
          boss.x = 4 + Math.random() * (CFG.canvasWidth - boss.width - 8);
          particlesRef.current.push(...spawnParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 4, colors.warning));
        }
      }

      if (phase === 3) {
        boss.ghostTimer -= TARGET_FRAME_MS * dt;
        if (boss.ghostActive) {
          if (boss.ghostTimer <= 0) {
            boss.ghostActive = false;
            boss.ghostTimer = 4000;
          }
        } else {
          if (boss.ghostTimer <= 0) {
            boss.ghostActive = true;
            boss.ghostTimer = 1500;
          }
        }

        if (boss.diveState === 'none' && Math.random() < 0.002 * dt) {
          boss.diveState = 'down';
          boss.diveY = boss.y;
        }
      }

      if (boss.diveState === 'down') {
        boss.y += 1.5 * dt;
        if (boss.y > boss.diveY + 60) boss.diveState = 'up';
      } else if (boss.diveState === 'up') {
        boss.y -= 1.5 * dt;
        if (boss.y <= boss.diveY) {
          boss.y = boss.diveY;
          boss.diveState = 'none';
        }
      }

      boss.shootTimer -= TARGET_FRAME_MS * dt;
      if (boss.shootTimer <= 0) {
        const bx = boss.x + boss.width / 2;
        const by2 = boss.y + boss.height;

        if (phase === 1) {
          boss.shootTimer = 2500;
          enemyBulletsRef.current.push({ x: bx - 1, y: by2, width: CFG.enemyBulletWidth, height: CFG.enemyBulletHeight, speed: CFG.enemyBulletSpeed });
        } else if (phase === 2) {
          boss.shootTimer = 2000;
          for (const off of [-6, 0, 6]) {
            enemyBulletsRef.current.push({ x: bx + off - 1, y: by2, width: CFG.enemyBulletWidth, height: CFG.enemyBulletHeight, speed: CFG.enemyBulletSpeed });
          }
        } else {
          boss.shootTimer = 1500;
          for (const off of [-10, -5, 0, 5, 10]) {
            enemyBulletsRef.current.push({ x: bx + off - 1, y: by2, width: CFG.enemyBulletWidth, height: CFG.enemyBulletHeight, speed: CFG.enemyBulletSpeed * 1.2 });
          }
        }
      }

      setBossHp({ hp: boss.hp, maxHp: boss.maxHp });
    }

    function gameLoop(now: number) {
      const deltaMs = Math.min(now - lastTime, 50);
      lastTime = now;
      const dt = deltaMs / TARGET_FRAME_MS;

      const keys = keysRef.current;
      const player = playerRef.current;
      const enemies = enemiesRef.current;
      const bullets = bulletsRef.current;
      const eBullets = enemyBulletsRef.current;
      const particles = particlesRef.current;
      const drops = powerUpsRef.current;
      const boss = bossRef.current;

      const ap = activePowerUpRef.current;
      if (ap && Date.now() >= ap.expiresAt) {
        activePowerUpRef.current = null;
        setActivePowerUpState(null);
      }

      if (keys.has('ArrowLeft') || keys.has('a')) player.x = Math.max(0, player.x - CFG.playerSpeed * dt);
      if (keys.has('ArrowRight') || keys.has('d')) player.x = Math.min(CFG.canvasWidth - player.width, player.x + CFG.playerSpeed * dt);

      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= CFG.bulletSpeed * dt;
        if (bullets[i].y + bullets[i].height < 0) bullets.splice(i, 1);
      }

      for (let i = eBullets.length - 1; i >= 0; i--) {
        eBullets[i].y += eBullets[i].speed * dt;
        if (eBullets[i].y > CFG.canvasHeight) { eBullets.splice(i, 1); continue; }
        if (rectsCollide(eBullets[i], player)) {
          eBullets.splice(i, 1);
          handlePlayerHit();
          if (gameState !== 'playing') return;
        }
      }

      if (boss) {
        updateBoss(boss, dt);

        if (!boss.ghostActive) {
          for (let bi = bullets.length - 1; bi >= 0; bi--) {
            if (rectsCollide(bullets[bi], boss)) {
              bullets.splice(bi, 1);
              boss.hp--;
              boss.flashFrames = 3;
              const cx = boss.x + boss.width / 2;
              const cy = boss.y + boss.height / 2;
              const phaseColor = boss.phase === 1 ? colors.accent : boss.phase === 2 ? colors.warning : colors.error;
              particlesRef.current.push(...spawnParticles(cx, cy, 3, phaseColor));

              if (boss.hp <= 0) {
                const earned = Math.round(CFG.scorePerEnemy * 25 * config.scoreMultiplier);
                scoreRef.current += earned;
                setScore(scoreRef.current);
                particlesRef.current.push(...spawnParticles(cx, cy, 25, phaseColor));
                shakeRef.current = 8;
                bossRef.current = null;
                setBossHp(null);
                setGameState('victory');
                return;
              }
              setBossHp({ hp: boss.hp, maxHp: boss.maxHp });
              break;
            }
          }

          if (boss && rectsCollide(boss, player)) {
            handlePlayerHit();
            if (gameState !== 'playing') return;
          }
        }
      }

      if (!boss) {
        let shouldReverse = false;
        const aliveEnemies = enemies.filter((e) => e.alive);

        for (const enemy of aliveEnemies) {
          const speedMult = enemy.enemyType === 'fast' ? 1.5 : 1;
          enemy.x += levelSpeed * speedMult * enemyDirRef.current * dt;
          if (enemy.x + enemy.width >= CFG.canvasWidth || enemy.x <= 0) shouldReverse = true;
        }

        if (shouldReverse) {
          enemyDirRef.current = (enemyDirRef.current * -1) as 1 | -1;
          for (const enemy of aliveEnemies) enemy.y += CFG.enemyDropY;
        }

        for (const enemy of aliveEnemies) {
          if (enemy.flashFrames > 0) enemy.flashFrames--;

          if (enemy.enemyType === 'shooter' && config.shooterFireRateMs > 0) {
            enemy.shootTimer -= TARGET_FRAME_MS * dt;
            if (enemy.shootTimer <= 0) {
              enemy.shootTimer = config.shooterFireRateMs * (0.7 + Math.random() * 0.6);
              const isBlocked = enemies.some((other) => other.alive && other !== enemy && other.y > enemy.y && Math.abs(other.x - enemy.x) < CFG.enemyWidth);
              if (!isBlocked) {
                eBullets.push({
                  x: enemy.x + enemy.width / 2 - CFG.enemyBulletWidth / 2,
                  y: enemy.y + enemy.height,
                  width: CFG.enemyBulletWidth,
                  height: CFG.enemyBulletHeight,
                  speed: CFG.enemyBulletSpeed,
                });
              }
            }
          }
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
                const now2 = Date.now();
                const timeSinceKill = now2 - lastKillRef.current;
                const combo = timeSinceKill < 500 ? 2 : timeSinceKill < 1000 ? 1.5 : 1;
                lastKillRef.current = now2;
                const earned = Math.round(CFG.scorePerEnemy * config.scoreMultiplier * combo);
                scoreRef.current += earned;
                setScore(scoreRef.current);
                particles.push(...spawnParticles(cx, cy, 7, color));
                spawnDrop(cx, cy);
              } else {
                enemy.flashFrames = 3;
                particles.push(...spawnParticles(cx, cy, 3, color));
              }
              break;
            }
          }
        }

        for (const enemy of aliveEnemies) {
          if (rectsCollide(enemy, player)) { handlePlayerHit(); if (gameState !== 'playing') return; }
          if (enemy.y + enemy.height >= player.y) { handlePlayerHit(); if (gameState !== 'playing') return; }
        }

        const allDead = enemies.every((e) => !e.alive);
        if (allDead) { setGameState('won'); return; }
      }

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.y += CFG.powerUpSpeed * dt;
        d.pulse += 0.15 * dt;
        if (d.y > CFG.canvasHeight) { drops.splice(i, 1); continue; }
        if (rectsCollide(d, player)) {
          applyPowerUp(d.type);
          drops.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      ctx.save();
      if (shakeRef.current > 0) {
        const intensity = Math.min(shakeRef.current, 4);
        ctx.translate((Math.random() - 0.5) * intensity * 2, (Math.random() - 0.5) * intensity * 2);
        shakeRef.current -= dt;
        if (shakeRef.current < 0) shakeRef.current = 0;
      }

      ctx.fillStyle = colors.surface;
      ctx.fillRect(-4, -4, CFG.canvasWidth + 8, CFG.canvasHeight + 8);

      drawPlayer(ctx, player, activePowerUpRef.current, colors);

      if (boss) drawBoss(ctx, boss, colors);

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        drawEnemy(ctx, enemy, colors);
      }

      ctx.fillStyle = colors.fg;
      for (const bullet of bullets) ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

      ctx.fillStyle = colors.error;
      for (const eb of eBullets) ctx.fillRect(eb.x, eb.y, eb.width, eb.height);

      for (const d of drops) drawPowerUp(ctx, d, colors);

      for (const p of particles) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = colors.fgMuted;
      ctx.font = '10px Geist, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(tRef.current('game.levelShort', { level: levelRef.current }), 4, 12);
      ctx.textAlign = 'right';
      ctx.fillText(`${scoreRef.current}`, CFG.canvasWidth - 4, 12);

      if (boss) {
        const barW = CFG.canvasWidth - 20;
        const barH = 3;
        const barX = 10;
        const barY = CFG.canvasHeight - 8;
        ctx.fillStyle = colors.fgMuted;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(barX, barY, barW, barH);
        ctx.globalAlpha = 1;
        const phaseColor2 = boss.phase === 1 ? colors.accent : boss.phase === 2 ? colors.warning : colors.error;
        ctx.fillStyle = phaseColor2;
        ctx.fillRect(barX, barY, barW * (boss.hp / boss.maxHp), barH);
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(gameLoop);
    }

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [gameState, endGame, advanceLevel]);

  const hasSavedProgress = gameSave.savedLevel > 1;

  return {
    canvasRef,
    gameState,
    score,
    currentLevel,
    gameSave,
    hasSavedProgress,
    bossHp,
    activePowerUp: activePowerUpState,
    handleNewGame,
    handleContinue,
    handleKeyDown,
    handleKeyUp,
    handleCanvasClick,
    isBossLevel: isBossLevel(currentLevel),
    canvasWidth: CFG.canvasWidth,
    canvasHeight: CFG.canvasHeight,
  };
}
