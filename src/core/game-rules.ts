export type BuffId = 'wind_boots' | 'thunder_tail' | 'cloud_magnet';

export interface BuffDefinition {
  id: BuffId;
  name: string;
  shortDesc: string;
  detail: string;
  accentColor: string;
}

export interface WaveConfig {
  wave: 1 | 2 | 3;
  title: string;
  subtitle: string;
  durationSec: number; // 0 for boss battle (ends when boss HP reaches 0)
  bossSpeed: number;
  bossLungeCooldown: number;
  talismanCooldown: number; // 0 = disabled
  talismanCount: number;
  cloudSpawnInterval: number;
  wispCount: number;
}

export interface RunModifiers {
  moveSpeedMult: number;
  dashCooldownSec: number;
  whipCooldownSec: number;
  whipStunSec: number;
  whipRadiusMult: number;
  cloudChargeMult: number;
  cloudMagnetRadiusMult: number;
  bossEnrageLevel: number; // increments each time player refuses Xin Khúc
  scoreMultiplier: number; // 1 or 2 for current wave
  appliedBuffs: BuffId[];
}

export interface RunStats {
  waveReached: number;
  whipHits: number;
  feverTriggers: number;
  cloudsCollected: number;
  segmentsRemaining: number;
  maxSegments: number;
  buffs: BuffId[];
  elapsedSec: number;
  bossHpRemaining: number;
  bossMaxHp: number;
}

export interface RankInfo {
  grade: 'S' | 'A' | 'B' | 'C';
  title: string;
  color: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C';
  victory: boolean;
  date: string;
}

export const GAME_CONSTANTS = {
  WORLD_WIDTH: 1440,
  WORLD_HEIGHT: 810,
  ARENA_PADDING_X: 118,
  ARENA_PADDING_Y: 88,
  BANYAN_CENTER_X: 720,
  BANYAN_CENTER_Y: 392,
  BANYAN_COLLISION_RADIUS: 68,

  INITIAL_SEGMENTS: 4,
  MAX_SEGMENTS: 5,
  SEGMENT_SPACING: 38,

  BASE_PLAYER_SPEED: 305,
  DASH_SPEED_MULT: 1.95,
  DASH_DURATION_SEC: 0.24,
  BASE_DASH_COOLDOWN_SEC: 1.2,
  BASE_WHIP_COOLDOWN_SEC: 10.0,
  WHIP_ACTIVE_DURATION_SEC: 0.52,
  BASE_WHIP_STUN_SEC: 2.0,
  BASE_WHIP_RADIUS: 52,

  HEAL_ITEM_SPAWN_INTERVAL_SEC: 10.0,
  HEAL_ITEM_MAX_ACTIVE: 2,
  SCORE_HEAL_ITEM_RESTORE: 30,
  SCORE_HEAL_ITEM_FULL_BONUS: 50,
  HEAL_ITEM_FULL_CLOUD_BONUS: 10,

  INVULNERABLE_DURATION_SEC: 1.5,

  FEVER_DURATION_SEC: 8.0,
  FEVER_SPEED_MULT: 1.25,
  FEVER_RAM_COOLDOWN_SEC: 0.4,
  CLOUD_CHARGE_PER_ORB: 6.25, // 16 orbs -> 100%
  BASE_MAGNET_RADIUS: 112,

  BOSS_MAX_HP: 1000,
  BOSS_LUNGE_WINDUP_SEC: 0.55,
  BOSS_LUNGE_DURATION_SEC: 0.36,
  BOSS_LUNGE_SPEED_MULT: 2.35,
  TALISMAN_TELEGRAPH_SEC: 1.0,
  TALISMAN_ACTIVE_SEC: 2.2,
  TALISMAN_RADIUS: 52,

  SCORE_CLOUD_ORB: 10,
  SCORE_WHIP_STUN: 100,
  SCORE_FEVER_RAM: 150,
  SCORE_WAVE_CLEAR: 300,
  SCORE_VICTORY_PER_SEGMENT: 250,
} as const;

export const BUFF_DEFINITIONS: Record<BuffId, BuffDefinition> = {
  wind_boots: {
    id: 'wind_boots',
    name: 'Hài Thần Gió',
    shortDesc: 'Tốc chạy +20% · Hồi Dash 0.9s',
    detail: 'Lướt gió quanh sân đình mượt mà, giảm thời gian hồi chiêu bứt tốc xuống 0.9 giây.',
    accentColor: '#06D6A0',
  },
  thunder_tail: {
    id: 'thunder_tail',
    name: 'Đuôi Sấm Sét',
    shortDesc: 'Choáng 3 giây · Tầm quất +30%',
    detail: 'Cú Quất Đuôi nổ tia sét làm Thầy Thuốc choáng 3 giây và mở rộng bán kính quất.',
    accentColor: '#FFB703',
  },
  cloud_magnet: {
    id: 'cloud_magnet',
    name: 'Tụ Mây Thần Tốc',
    shortDesc: 'Nạp Mây +35% · Hút Mây x2',
    detail: 'Hút Hạt Mây từ xa gấp đôi và nạp thanh Lên Mây nhanh hơn 35%.',
    accentColor: '#9B5DE5',
  },
};

export const WAVE_CONFIGS: Record<1 | 2 | 3, WaveConfig> = {
  1: {
    wave: 1,
    title: 'Đợt 1 · Hội Làng Khởi Động',
    subtitle: 'Né Thầy Thuốc, gom Hạt Mây và bẻ cua Quất Đuôi',
    durationSec: 35,
    bossSpeed: 218,
    bossLungeCooldown: 6.2,
    talismanCooldown: 0,
    talismanCount: 0,
    cloudSpawnInterval: 1.45,
    wispCount: 0,
  },
  2: {
    wave: 2,
    title: 'Đợt 2 · Bùa Độc Tăng Nhiệt',
    subtitle: 'Thầy Thuốc tăng tốc & ném Bùa Độc cản đường',
    durationSec: 45,
    bossSpeed: 248,
    bossLungeCooldown: 5.0,
    talismanCooldown: 4.4,
    talismanCount: 2,
    cloudSpawnInterval: 1.35,
    wispCount: 1,
  },
  3: {
    wave: 3,
    title: 'Đợt 3 · Trảm Trùm Thầy Thuốc',
    subtitle: 'Tích đủ Mây hóa Rồng Ánh Sáng húc cạn 1.000 HP Boss',
    durationSec: 0,
    bossSpeed: 266,
    bossLungeCooldown: 4.2,
    talismanCooldown: 3.6,
    talismanCount: 3,
    cloudSpawnInterval: 1.15,
    wispCount: 2,
  },
};

export function createInitialModifiers(): RunModifiers {
  return {
    moveSpeedMult: 1,
    dashCooldownSec: GAME_CONSTANTS.BASE_DASH_COOLDOWN_SEC,
    whipCooldownSec: GAME_CONSTANTS.BASE_WHIP_COOLDOWN_SEC,
    whipStunSec: GAME_CONSTANTS.BASE_WHIP_STUN_SEC,
    whipRadiusMult: 1,
    cloudChargeMult: 1,
    cloudMagnetRadiusMult: 1,
    bossEnrageLevel: 0,
    scoreMultiplier: 1,
    appliedBuffs: [],
  };
}

export function canActivateWhip(
  whipCooldownLeft: number,
  whipActiveTimer: number,
  isFever: boolean,
  segmentsCount: number
): boolean {
  return whipCooldownLeft <= 0 && whipActiveTimer <= 0 && !isFever && segmentsCount > 0;
}

export function applyHealSegmentPickup(
  currentSegments: number,
  maxSegments: number,
  scoreMultiplier: number
): {
  nextSegments: number;
  restored: boolean;
  bonusScore: number;
  bonusCloudPercent: number;
} {
  const safeCurrent = Math.max(0, Math.floor(currentSegments));
  const safeMax = Math.max(1, Math.floor(maxSegments));
  if (safeCurrent < safeMax) {
    return {
      nextSegments: safeCurrent + 1,
      restored: true,
      bonusScore: calculateActionPoints(GAME_CONSTANTS.SCORE_HEAL_ITEM_RESTORE, scoreMultiplier),
      bonusCloudPercent: 0,
    };
  }
  return {
    nextSegments: safeCurrent,
    restored: false,
    bonusScore: calculateActionPoints(GAME_CONSTANTS.SCORE_HEAL_ITEM_FULL_BONUS, scoreMultiplier),
    bonusCloudPercent: GAME_CONSTANTS.HEAL_ITEM_FULL_CLOUD_BONUS,
  };
}

export function canSacrificeSegment(currentSegments: number): boolean {
  return currentSegments >= 2;
}

export function applyXinKhucChoice(
  currentSegments: number,
  modifiers: RunModifiers,
  choice: 'sacrifice' | 'refuse',
  buffId?: BuffId
): { nextSegments: number; nextModifiers: RunModifiers } {
  const nextModifiers: RunModifiers = {
    ...modifiers,
    appliedBuffs: [...modifiers.appliedBuffs],
  };

  if (choice === 'sacrifice' && canSacrificeSegment(currentSegments) && buffId) {
    const nextSegments = currentSegments - 1;
    nextModifiers.scoreMultiplier = 1;
    if (!nextModifiers.appliedBuffs.includes(buffId)) {
      nextModifiers.appliedBuffs.push(buffId);
    }

    if (buffId === 'wind_boots') {
      nextModifiers.moveSpeedMult = Number((nextModifiers.moveSpeedMult * 1.2).toFixed(3));
      nextModifiers.dashCooldownSec = Math.min(nextModifiers.dashCooldownSec, 0.9);
    } else if (buffId === 'thunder_tail') {
      nextModifiers.whipStunSec = Math.max(nextModifiers.whipStunSec + 1.0, 3.0);
      nextModifiers.whipRadiusMult = Number((nextModifiers.whipRadiusMult * 1.3).toFixed(3));
    } else if (buffId === 'cloud_magnet') {
      nextModifiers.cloudChargeMult = Number((nextModifiers.cloudChargeMult * 1.35).toFixed(3));
      nextModifiers.cloudMagnetRadiusMult = Number((nextModifiers.cloudMagnetRadiusMult * 2.0).toFixed(3));
    }

    return { nextSegments, nextModifiers };
  }

  // Refuse (Khịa Thầy Thuốc): keep all segments, Boss gets faster (+15% per enrage), x2 score for next wave
  nextModifiers.bossEnrageLevel += 1;
  nextModifiers.scoreMultiplier = 2;
  return { nextSegments: currentSegments, nextModifiers };
}

export function getEffectiveBossSpeed(wave: 1 | 2 | 3, bossEnrageLevel: number): number {
  const base = WAVE_CONFIGS[wave].bossSpeed;
  return Math.round(base * Math.pow(1.15, bossEnrageLevel));
}

export function calculateFeverRamDamage(segmentsCount: number): number {
  const safeSegments = Math.max(0, Math.floor(segmentsCount));
  return 100 + 25 * safeSegments;
}

export function calculateActionPoints(basePoints: number, scoreMultiplier: number): number {
  return Math.round(basePoints * Math.max(1, scoreMultiplier));
}

export function calculateVictorySegmentBonus(segmentsRemaining: number): number {
  return Math.max(0, Math.floor(segmentsRemaining)) * GAME_CONSTANTS.SCORE_VICTORY_PER_SEGMENT;
}

export function computeRank(score: number): RankInfo {
  if (score >= 3500) {
    return { grade: 'S', title: 'CHÂN LONG LÊN MÂY', color: '#FFB703' };
  }
  if (score >= 2200) {
    return { grade: 'A', title: 'CAO THỦ QUẤT ĐUÔI', color: '#06D6A0' };
  }
  if (score >= 1200) {
    return { grade: 'B', title: 'TAY LÁI HỘI LÀNG', color: '#9B5DE5' };
  }
  return { grade: 'C', title: 'MỒI NGON THẦY THUỐC', color: '#E63946' };
}

export function pickBuffChoices(appliedBuffs: BuffId[]): BuffDefinition[] {
  const allIds: BuffId[] = ['wind_boots', 'thunder_tail', 'cloud_magnet'];
  const remaining = allIds.filter((id) => !appliedBuffs.includes(id));
  const pool = remaining.length > 0 ? remaining : allIds;
  return pool.map((id) => BUFF_DEFINITIONS[id]);
}

const LEADERBOARD_KEY = 'rong_ran_len_may_leaderboard_v1';
const HIGH_SCORE_KEY = 'rong_ran_len_may_highscore_v1';

export function loadHighScore(): number {
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): number {
  const best = Math.max(loadHighScore(), Math.floor(score));
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(best));
  } catch {
    // ignore storage errors in private mode
  }
  return best;
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.name === 'string' && typeof e.score === 'number')
      .slice(0, 5);
  } catch {
    return [];
  }
}

export function saveLeaderboardEntry(
  name: string,
  score: number,
  victory: boolean
): LeaderboardEntry[] {
  const cleanName = name.trim().slice(0, 16) || 'Chân Long';
  const rank = computeRank(score);
  const existing = loadLeaderboard();
  const next: LeaderboardEntry[] = [
    ...existing,
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      score: Math.floor(score),
      grade: rank.grade,
      victory,
      date: new Date().toLocaleDateString('vi-VN'),
    },
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  try {
    window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}
