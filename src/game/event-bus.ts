import type { BuffDefinition, BuffId, RankInfo, RunStats } from '../core/game-rules';

export interface HudSnapshot {
  score: number;
  multiplier: number;
  segmentsCount: number;
  maxSegments: number;
  cloudPercent: number;
  wave: 1 | 2 | 3;
  waveTitle: string;
  waveTimeLeft: number;
  bossHp: number;
  bossMaxHp: number;
  bossStunned: boolean;
  isFever: boolean;
  feverTimeLeft: number;
  dashCooldownRatio: number; // 1 = ready, 0 = just used
  whipActive: boolean;
  whipCooldownLeft: number; // seconds remaining (0 = ready)
  whipCooldownMax: number;
  healItemNextSec: number; // seconds until next heal item spawns
  healItemActiveCount: number;
  appliedBuffs: BuffId[];
  bannerText: string | null;
}

export interface XinKhucPayload {
  waveCompleted: 1 | 2;
  segmentsCount: number;
  canSacrifice: boolean;
  buffChoices: BuffDefinition[];
}

export interface GameEndedPayload {
  victory: boolean;
  score: number;
  bestScore: number;
  rank: RankInfo;
  stats: RunStats;
  bossQuote: string;
}

export interface EventMap {
  'hud:update': HudSnapshot;
  'xinkhuc:open': XinKhucPayload;
  'game:ended': GameEndedPayload;
  'game:state': { state: 'title' | 'playing' | 'paused' | 'gameover' };
  'audio:muteChanged': { muted: boolean };

  // React -> Phaser commands
  'game:start': void;
  'game:restart': void;
  'game:returnTitle': void;
  'game:setPaused': { paused: boolean };
  'xinkhuc:select': { choice: 'sacrifice' | 'refuse'; buffId?: BuffId };
  'audio:toggleMute': void;
}

type Listener<T> = (payload: T) => void;

class TypedEventBus {
  private listeners: Map<keyof EventMap, Set<Listener<unknown>>> = new Map();

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<unknown>);
    return () => {
      set?.delete(listener as Listener<unknown>);
    };
  }

  emit<K extends keyof EventMap>(
    event: K,
    ...args: EventMap[K] extends void ? [] : [EventMap[K]]
  ): void {
    const set = this.listeners.get(event);
    if (!set) return;
    const payload = args[0];
    set.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[EventBus] listener error on ${String(event)}`, err);
      }
    });
  }
}

export const eventBus = new TypedEventBus();
