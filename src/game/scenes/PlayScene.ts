import Phaser from 'phaser';
import {
  COURTYARD_ARENA_BOUNDS,
  ChainSegment,
  Vec2,
  angleDelta,
  createInitialChain,
  distanceBetween,
  findFleeWaypointTarget,
  findPathAroundObstacles,
  isPointClearOfObstacles,
  isSegmentClearOfObstacles,
  moveWithObstacleSubsteps,
  normalizeAngle,
  resolveArenaPosition,
  shouldTriggerDriftWhip,
  stepChainPhysics,
} from '../../core/chain-math';
import {
  GAME_CONSTANTS,
  RunModifiers,
  RunStats,
  WAVE_CONFIGS,
  applyHealSegmentPickup,
  applyXinKhucChoice,
  calculateActionPoints,
  calculateFeverRamDamage,
  calculateVictorySegmentBonus,
  canActivateWhip,
  canSacrificeSegment,
  computeRank,
  createInitialModifiers,
  getEffectiveBossSpeed,
  pickBuffChoices,
  saveHighScore,
} from '../../core/game-rules';
import { audioManager } from '../audio-manager';
import { eventBus, HudSnapshot } from '../event-bus';
import { createProceduralTextures } from '../texture-utils';

interface CloudOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bobPhase: number;
  sprite: Phaser.GameObjects.Image;
}

interface HealItem {
  x: number;
  y: number;
  bobPhase: number;
  sprite: Phaser.GameObjects.Image;
}

interface TalismanHazard {
  x: number;
  y: number;
  state: 'telegraph' | 'active';
  timer: number;
  radius: number;
  sprite: Phaser.GameObjects.Image;
}

interface SpiritWisp {
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Image;
}

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  startScale: number;
  endScale: number;
  sprite: Phaser.GameObjects.Image;
}

interface FloatingTextItem {
  text: Phaser.GameObjects.Text;
  vy: number;
  life: number;
  maxLife: number;
}

type SceneMode = 'title' | 'playing' | 'paused' | 'xinkhuc' | 'ko_beat' | 'gameover';

const ARENA_BOUNDS = COURTYARD_ARENA_BOUNDS;

export class PlayScene extends Phaser.Scene {
  private mode: SceneMode = 'title';
  private unsubscribers: Array<() => void> = [];

  // World visuals
  private bgImage!: Phaser.GameObjects.Image;
  private moodOverlay!: Phaser.GameObjects.Rectangle;
  private fxGraphics!: Phaser.GameObjects.Graphics;
  private telegraphGraphics!: Phaser.GameObjects.Graphics;
  private spineGraphics!: Phaser.GameObjects.Graphics;

  // Player & tail chain
  private playerX = 330;
  private playerY = 560;
  private playerAngle = -0.3;
  private playerDistTraveled = 0;
  private playerSprite!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private playerSquashX = 1;
  private playerSquashY = 1;

  private segments: ChainSegment[] = [];
  private segmentSprites: Phaser.GameObjects.Image[] = [];
  private tailTrailPoints: Array<{ x: number; y: number; life: number }> = [];

  // Dash & Drift Whip
  private dashTimer = 0;
  private dashCooldown = 0;
  private dashGraceTimer = 0;
  private dashBufferTimer = 0;
  private accumulatedTurn = 0;
  private whipTimer = 0;
  private whipCooldown = 0;
  private whipHitCooldown = 0;
  private invulnTimer = 0;

  // Boss (Thầy Thuốc)
  private bossX = 1090;
  private bossY = 210;
  private bossVx = 0;
  private bossVy = 0;
  private bossSprite!: Phaser.GameObjects.Image;
  private bossShadow!: Phaser.GameObjects.Ellipse;
  private bossHp: number = GAME_CONSTANTS.BOSS_MAX_HP;
  private bossStunTimer = 0;
  private bossHitFlashTimer = 0;
  private bossEntranceGrace = 1.4;
  private bossLungeCooldown = 5.5;
  private bossLungeState: 'chase' | 'windup' | 'lunge' = 'chase';
  private bossLungeTimer = 0;
  private bossLungeDirX = 0;
  private bossLungeDirY = 0;
  private bossRamCooldown = 0;
  private bossPath: Vec2[] = [];
  private bossPathTimer = 0;

  // Hazards & pickups
  private clouds: CloudOrb[] = [];
  private cloudSpawnTimer = 0;
  private cloudCombo = 0;
  private cloudComboResetTimer = 0;
  private healItems: HealItem[] = [];
  private healSpawnTimer: number = GAME_CONSTANTS.HEAL_ITEM_SPAWN_INTERVAL_SEC;
  private talismans: TalismanHazard[] = [];
  private talismanSpawnTimer = 2.5;
  private wisps: SpiritWisp[] = [];

  // Pooled particles & floating popups
  private particlePool: PooledParticle[] = [];
  private particleCursor = 0;
  private floatingTexts: FloatingTextItem[] = [];

  // Progression & scoring
  private wave: 1 | 2 | 3 = 1;
  private waveTimeLeft: number = WAVE_CONFIGS[1].durationSec;
  private score = 0;
  private cloudPercent = 0;
  private isFever = false;
  private feverTimer = 0;
  private modifiers: RunModifiers = createInitialModifiers();
  private stats: RunStats = this.makeFreshStats();
  private bannerText: string | null = null;
  private bannerTimer = 0;
  private koBeatTimer = 0;
  private pendingVictory = false;

  // Juice: hitstop & camera trauma
  private hitstopTimer = 0;
  private shakeTrauma = 0;
  private damageFlashAlpha = 0;
  private titleClock = 0;
  private hudEmitAccum = 0;
  private lastHudKey = '';

  // Input state
  private keysHeld = new Set<string>();
  private mouseWorldX = 500;
  private mouseWorldY = 400;
  private mouseSteeringActive = false;
  private boundKeyDown?: (e: KeyboardEvent) => void;
  private boundKeyUp?: (e: KeyboardEvent) => void;
  private boundBlur?: () => void;
  private boundVisibility?: () => void;

  constructor() {
    super('PlayScene');
  }

  private makeFreshStats(): RunStats {
    return {
      waveReached: 1,
      whipHits: 0,
      feverTriggers: 0,
      cloudsCollected: 0,
      segmentsRemaining: GAME_CONSTANTS.INITIAL_SEGMENTS,
      maxSegments: GAME_CONSTANTS.INITIAL_SEGMENTS,
      buffs: [],
      elapsedSec: 0,
      bossHpRemaining: GAME_CONSTANTS.BOSS_MAX_HP,
      bossMaxHp: GAME_CONSTANTS.BOSS_MAX_HP,
    };
  }

  public preload(): void {
    this.load.image('bg_courtyard', '/assets/aistudio/image_2e458c28.png');
    this.load.image('player_cotam', '/assets/aistudio/skin_co_tam_285e2153.png');
    this.load.image('boss_thaythuoc', '/assets/aistudio/boss_thay_thuoc_idle_fea08f45.png');
  }

  public create(): void {
    createProceduralTextures(this);

    const { WORLD_WIDTH, WORLD_HEIGHT } = GAME_CONSTANTS;
    this.cameras.main.setBounds(-40, -40, WORLD_WIDTH + 80, WORLD_HEIGHT + 80);
    this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    // 1. Pre-bake 1:1 scaled courtyard background so Canvas2D never bilinear-resamples 1672x941 per frame
    const bakedBgKey = 'bg_courtyard_1to1';
    if (!this.textures.exists(bakedBgKey)) {
      const srcImg = this.textures.get('bg_courtyard').getSourceImage() as HTMLImageElement;
      const baked = this.textures.createCanvas(bakedBgKey, WORLD_WIDTH, WORLD_HEIGHT);
      if (baked && srcImg) {
        const ctx = baked.getContext();
        ctx.drawImage(srcImg, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        baked.refresh();
      }
    }
    this.bgImage = this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, this.textures.exists(bakedBgKey) ? bakedBgKey : 'bg_courtyard')
      .setDepth(0);

    // 2. Twilight Đông Hồ Neon atmospheric tint (enhances figure-ground separation)
    this.moodOverlay = this.add
      .rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH + 120, WORLD_HEIGHT + 120, 0x120e1f, 0.24)
      .setDepth(2);

    // 3. Graphics layers
    this.telegraphGraphics = this.add.graphics().setDepth(4);
    this.spineGraphics = this.add.graphics().setDepth(7);
    this.fxGraphics = this.add.graphics().setDepth(16);

    // 4. Shadows & actors
    this.playerShadow = this.add.ellipse(this.playerX, this.playerY + 24, 54, 22, 0x070410, 0.55).setDepth(6);
    this.bossShadow = this.add.ellipse(this.bossX, this.bossY + 34, 82, 32, 0x070410, 0.6).setDepth(6);

    this.playerSprite = this.add.image(this.playerX, this.playerY, 'player_cotam').setScale(0.32).setDepth(12);
    this.bossSprite = this.add.image(this.bossX, this.bossY, 'boss_thaythuoc').setScale(0.39).setDepth(13);

    // 5. Pre-allocate Zero-GC particle ring buffer (uses pre-baked colored textures, zero runtime Canvas tinting)
    for (let i = 0; i < 96; i++) {
      const sprite = this.add
        .image(-200, -200, 'glow_gold')
        .setVisible(false)
        .setDepth(15);
      this.particlePool.push({
        active: false,
        x: -200,
        y: -200,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        startScale: 1,
        endScale: 0,
        sprite,
      });
    }

    this.setupInputs();
    this.setupEventBridge();

    // Start in atmospheric Title Showcase mode (or autostart if requested)
    this.resetWorldEntities(true);
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const autostart = params?.get('autostart') === '1';
    const startFever = params?.get('fever') === '1';

    if (autostart) {
      this.startNewRun();
      if (startFever) {
        this.triggerFeverMode();
      }
    } else {
      this.enterTitleMode();
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
  }

  private setupInputs(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.mode !== 'playing') return;
      this.mouseWorldX = pointer.worldX;
      this.mouseWorldY = pointer.worldY;
      this.mouseSteeringActive = true;
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      audioManager.unlock();
      if (this.mode !== 'playing') return;
      if (pointer.leftButtonDown() || pointer.wasTouch || pointer.isDown) {
        this.mouseWorldX = pointer.worldX;
        this.mouseWorldY = pointer.worldY;
        this.dashBufferTimer = 0.14;
      }
    });

    this.boundKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      audioManager.unlock();
      const code = e.code;

      if (
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight' ||
        code === 'Space'
      ) {
        if (this.mode === 'playing') {
          e.preventDefault();
        }
      }

      if (this.mode === 'playing') {
        const wasHeld = this.keysHeld.has(code);
        this.keysHeld.add(code);
        if (
          code === 'KeyW' ||
          code === 'KeyA' ||
          code === 'KeyS' ||
          code === 'KeyD' ||
          code === 'ArrowUp' ||
          code === 'ArrowDown' ||
          code === 'ArrowLeft' ||
          code === 'ArrowRight'
        ) {
          this.mouseSteeringActive = false;
        }
        // Edge-triggered dash with input buffering
        if (!wasHeld && (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight')) {
          this.dashBufferTimer = 0.14;
        }
      }
    };

    this.boundKeyUp = (e: KeyboardEvent) => {
      this.keysHeld.delete(e.code);
    };

    this.boundBlur = () => {
      this.keysHeld.clear();
      this.mouseSteeringActive = false;
    };

    this.boundVisibility = () => {
      if (document.hidden) {
        this.keysHeld.clear();
        this.mouseSteeringActive = false;
      }
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', this.boundBlur);
    document.addEventListener('visibilitychange', this.boundVisibility);
  }

  private setupEventBridge(): void {
    this.unsubscribers.push(
      eventBus.on('game:start', () => {
        audioManager.unlock();
        this.startNewRun();
      }),
      eventBus.on('game:restart', () => {
        audioManager.unlock();
        this.startNewRun();
      }),
      eventBus.on('game:returnTitle', () => {
        this.enterTitleMode();
      }),
      eventBus.on('game:dash', () => {
        audioManager.unlock();
        if (this.mode !== 'playing') return;
        this.dashBufferTimer = 0.14;
      }),
      eventBus.on('game:setPaused', ({ paused }) => {
        if (paused && this.mode === 'playing') {
          this.mode = 'paused';
          this.keysHeld.clear();
          audioManager.setMusicState({ playing: true, paused: true });
          eventBus.emit('game:state', { state: 'paused' });
        } else if (!paused && this.mode === 'paused') {
          this.mode = 'playing';
          this.keysHeld.clear();
          audioManager.setMusicState({ playing: true, paused: false, fever: this.isFever, wave: this.wave });
          eventBus.emit('game:state', { state: 'playing' });
        }
      }),
      eventBus.on('xinkhuc:select', ({ choice, buffId }) => {
        if (this.mode !== 'xinkhuc') return;
        this.handleXinKhucSelection(choice, buffId);
      }),
      eventBus.on('audio:toggleMute', () => {
        audioManager.unlock();
        const muted = audioManager.toggleMute();
        eventBus.emit('audio:muteChanged', { muted });
      })
    );
  }

  private cleanup(): void {
    this.unsubscribers.forEach((fn) => fn());
    this.unsubscribers = [];
    if (this.boundKeyDown) window.removeEventListener('keydown', this.boundKeyDown);
    if (this.boundKeyUp) window.removeEventListener('keyup', this.boundKeyUp);
    if (this.boundBlur) window.removeEventListener('blur', this.boundBlur);
    if (this.boundVisibility) document.removeEventListener('visibilitychange', this.boundVisibility);
    audioManager.setMusicState({ playing: false });
  }

  private enterTitleMode(): void {
    this.mode = 'title';
    this.keysHeld.clear();
    this.resetWorldEntities(true);
    audioManager.setMusicState({ playing: false });
    eventBus.emit('game:state', { state: 'title' });
  }

  private startNewRun(): void {
    this.mode = 'playing';
    this.keysHeld.clear();
    this.mouseSteeringActive = false;

    this.wave = 1;
    this.waveTimeLeft = WAVE_CONFIGS[1].durationSec;
    this.score = 0;
    this.cloudPercent = 0;
    this.isFever = false;
    this.feverTimer = 0;
    this.modifiers = createInitialModifiers();
    this.stats = this.makeFreshStats();
    this.hitstopTimer = 0;
    this.shakeTrauma = 0;
    this.damageFlashAlpha = 0;
    this.koBeatTimer = 0;
    this.pendingVictory = false;

    this.resetWorldEntities(false);
    this.showBanner('ĐỢT 1 · HỘI LÀNG KHỞI ĐỘNG', 2.4);

    audioManager.setMusicState({ playing: true, paused: false, fever: false, wave: 1 });
    eventBus.emit('game:state', { state: 'playing' });
    this.emitHud(true);
  }

  private resetWorldEntities(forTitle: boolean): void {
    // Clear existing segment sprites, clouds, talismans, wisps, floating texts
    this.segmentSprites.forEach((s) => s.destroy());
    this.segmentSprites = [];
    this.clouds.forEach((c) => c.sprite.destroy());
    this.clouds = [];
    this.healItems.forEach((h) => h.sprite.destroy());
    this.healItems = [];
    this.talismans.forEach((t) => t.sprite.destroy());
    this.talismans = [];
    this.wisps.forEach((w) => w.sprite.destroy());
    this.wisps = [];
    this.floatingTexts.forEach((f) => f.text.destroy());
    this.floatingTexts = [];
    this.tailTrailPoints = [];

    for (const p of this.particlePool) {
      p.active = false;
      p.sprite.setVisible(false);
    }

    // Spawn player on open lower-left courtyard lane facing East along the clear dirt road
    this.playerX = 330;
    this.playerY = 565;
    this.playerAngle = 0;
    this.playerDistTraveled = 0;
    this.playerSquashX = 1;
    this.playerSquashY = 1;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashGraceTimer = 0;
    this.dashBufferTimer = 0;
    this.accumulatedTurn = 0;
    this.whipTimer = 0;
    this.whipCooldown = 0;
    this.whipHitCooldown = 0;
    this.invulnTimer = forTitle ? 999 : 0.8;

    this.segments = createInitialChain(
      this.playerX,
      this.playerY,
      GAME_CONSTANTS.INITIAL_SEGMENTS,
      GAME_CONSTANTS.SEGMENT_SPACING,
      this.playerAngle
    );
    this.rebuildSegmentSprites();

    // Spawn Thầy Thuốc on open upper road in front of the red Village Gate (Cổng Làng)
    this.bossX = 720;
    this.bossY = 192;
    this.bossVx = 0;
    this.bossVy = 0;
    this.bossHp = GAME_CONSTANTS.BOSS_MAX_HP;
    this.bossStunTimer = 0;
    this.bossHitFlashTimer = 0;
    this.bossEntranceGrace = 1.4;
    this.bossLungeCooldown = WAVE_CONFIGS[1].bossLungeCooldown;
    this.bossLungeState = 'chase';
    this.bossLungeTimer = 0;
    this.bossRamCooldown = 0;
    this.bossPath = [];
    this.bossPathTimer = 0;
    this.bossSprite.setVisible(true).setAlpha(1).setAngle(0).setScale(0.39);
    this.bossShadow.setVisible(true).setScale(1);

    this.playerSprite
      .setTexture('player_cotam')
      .setPosition(this.playerX, this.playerY)
      .setRotation(0)
      .setFlipX(false)
      .setAlpha(1);
    this.bossSprite.setPosition(this.bossX, this.bossY);
    this.moodOverlay.setFillStyle(0x120e1f, 0.24);

    // Seed initial Cloud Orbs strictly on verified obstacle-free courtyard dirt paths
    const seedPositions = [
      { x: 525, y: 295 },
      { x: 915, y: 295 },
      { x: 515, y: 505 },
      { x: 925, y: 505 },
      { x: 720, y: 548 },
      { x: 158, y: 400 },
      { x: 1282, y: 400 },
    ];
    for (const pt of seedPositions) {
      if (isPointClearOfObstacles(pt.x, pt.y, 20, ARENA_BOUNDS)) {
        this.spawnCloudOrbAt(pt.x, pt.y);
      }
    }
    this.cloudSpawnTimer = 1.0;
    this.healSpawnTimer = GAME_CONSTANTS.HEAL_ITEM_SPAWN_INTERVAL_SEC;
    this.talismanSpawnTimer = 2.8;
  }

  private rebuildSegmentSprites(): void {
    this.segmentSprites.forEach((s) => s.destroy());
    this.segmentSprites = this.segments.map((seg, idx) => {
      const isTip = idx === this.segments.length - 1;
      const key = this.isFever
        ? isTip
          ? 'dragon_tail_tip'
          : 'dragon_body_seg'
        : isTip
          ? 'seg_tip'
          : 'seg_lantern';
      const sprite = this.add.image(seg.x, seg.y, key).setDepth(10 - idx * 0.1);
      sprite.setScale(this.isFever ? (isTip ? 0.98 : 0.92 - idx * 0.05) : isTip ? 0.86 : 0.74);
      sprite.setRotation(this.isFever ? seg.angle : 0);
      return sprite;
    });
  }

  private spawnWispsForWave(count: number): void {
    this.wisps.forEach((w) => w.sprite.destroy());
    this.wisps = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / Math.max(1, count) + 0.5;
      // Orbit cleanly around the Banyan Tree inside the open central plaza
      const radius = i % 2 === 0 ? 185 : 210;
      const x = ARENA_BOUNDS.banyanX + Math.cos(angle) * radius;
      const y = ARENA_BOUNDS.banyanY + Math.sin(angle) * (radius * 0.72);
      const sprite = this.add.image(x, y, 'spirit_wisp').setScale(0.95).setDepth(11);
      this.wisps.push({
        orbitRadius: radius,
        orbitAngle: angle,
        orbitSpeed: i % 2 === 0 ? 0.95 : -0.78,
        x,
        y,
        sprite,
      });
    }
  }

  public update(_time: number, deltaMs: number): void {
    // Clamp frame dt to <= 0.05s per game craft guidelines
    const rawDt = Math.min(deltaMs / 1000, 0.05);

    if (this.mode === 'title') {
      this.updateTitleShowcase(rawDt);
      this.updateParticles(rawDt);
      this.renderWorldGraphics(rawDt);
      return;
    }

    if (this.mode === 'paused' || this.mode === 'xinkhuc' || this.mode === 'gameover') {
      return;
    }

    if (this.mode === 'ko_beat') {
      this.updateCameraShake(rawDt);
      this.updateParticles(rawDt);
      this.updateFloatingTexts(rawDt);
      this.koBeatTimer -= rawDt;
      if (this.pendingVictory) {
        this.bossSprite.setAlpha(Math.max(0, this.koBeatTimer / 0.55));
        this.bossSprite.setAngle(this.bossSprite.angle + rawDt * 420);
        this.bossSprite.setScale(this.bossSprite.scaleX * (1 + rawDt * 0.6));
      }
      if (this.koBeatTimer <= 0) {
        this.finishRun(this.pendingVictory);
      }
      this.renderWorldGraphics(rawDt);
      return;
    }

    // Active Playing Loop
    this.updateCameraShake(rawDt);
    this.updateParticles(rawDt);
    this.updateFloatingTexts(rawDt);

    if (this.damageFlashAlpha > 0) {
      this.damageFlashAlpha = Math.max(0, this.damageFlashAlpha - rawDt * 2.8);
    }
    if (this.bossHitFlashTimer > 0) {
      this.bossHitFlashTimer = Math.max(0, this.bossHitFlashTimer - rawDt);
    }

    // Real simulation hitstop (renders, flashes, shake keep running in rawDt while sim pauses)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - rawDt);
      this.renderWorldGraphics(rawDt);
      return;
    }

    const dt = rawDt;
    this.stats.elapsedSec += dt;
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerText = null;
    }

    this.updatePlayerAndChain(dt);
    this.updateFever(dt);
    this.updateBossAI(dt);
    this.updateCloudOrbs(dt);
    this.updateHealItems(dt);
    this.updateTalismans(dt);
    this.updateWisps(dt);
    this.updateWaveProgress(dt);
    this.renderWorldGraphics(dt);

    // Throttle React HUD emissions (~15Hz or immediately on discrete changes)
    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.065) {
      this.hudEmitAccum = 0;
      this.emitHud(false);
    }
  }

  private updateTitleShowcase(dt: number): void {
    this.titleClock += dt;
    const t = this.titleClock * 0.85;
    // Cô Tấm glides cleanly around the open central plaza ring outside the Banyan Tree
    const rawX = ARENA_BOUNDS.banyanX + Math.cos(t) * 208;
    const rawY = ARENA_BOUNDS.banyanY + Math.sin(t) * 146;
    const resolvedP = resolveArenaPosition(rawX, rawY, 22, ARENA_BOUNDS);
    const dx = resolvedP.x - this.playerX;
    const dy = resolvedP.y - this.playerY;
    if (Math.hypot(dx, dy) > 0.5) {
      this.playerAngle = Math.atan2(dy, dx);
    }
    this.playerDistTraveled += Math.hypot(dx, dy);
    this.playerX = resolvedP.x;
    this.playerY = resolvedP.y;

    stepChainPhysics(
      { x: this.playerX, y: this.playerY },
      this.segments,
      GAME_CONSTANTS.SEGMENT_SPACING,
      dt,
      false,
      ARENA_BOUNDS
    );

    // Boss patrols opposite side of the Banyan Tree ring without clipping any obstacle
    const bt = t + Math.PI;
    const resolvedB = resolveArenaPosition(
      ARENA_BOUNDS.banyanX + Math.cos(bt) * 208,
      ARENA_BOUNDS.banyanY + Math.sin(bt) * 146,
      28,
      ARENA_BOUNDS
    );
    this.bossX = resolvedB.x;
    this.bossY = resolvedB.y;

    // Gentle ambient camera drift
    this.cameras.main.centerOn(
      GAME_CONSTANTS.WORLD_WIDTH / 2 + Math.sin(this.titleClock * 0.35) * 18,
      GAME_CONSTANTS.WORLD_HEIGHT / 2 + Math.cos(this.titleClock * 0.28) * 12
    );

    // Ambient floating fireflies
    if (Math.random() < dt * 7) {
      this.spawnParticle(
        Phaser.Math.Between(140, 1300),
        Phaser.Math.Between(100, 720),
        Phaser.Math.FloatBetween(-18, 18),
        Phaser.Math.FloatBetween(-32, -8),
        Phaser.Math.FloatBetween(0.8, 1.5),
        0.55,
        0.05,
        Math.random() < 0.5 ? 0xffb703 : 0x06d6a0
      );
    }

    this.syncActorVisuals(dt);
  }

  private updatePlayerAndChain(dt: number): void {
    // Timers
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (this.dashTimer > 0) this.dashTimer = Math.max(0, this.dashTimer - dt);
    if (this.dashGraceTimer > 0) this.dashGraceTimer = Math.max(0, this.dashGraceTimer - dt);
    if (this.dashBufferTimer > 0) this.dashBufferTimer = Math.max(0, this.dashBufferTimer - dt);
    if (this.whipTimer > 0) this.whipTimer = Math.max(0, this.whipTimer - dt);
    if (this.whipCooldown > 0) this.whipCooldown = Math.max(0, this.whipCooldown - dt);
    if (this.whipHitCooldown > 0) this.whipHitCooldown = Math.max(0, this.whipHitCooldown - dt);
    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);

    // Consume buffered Dash on first legal frame
    if (this.dashBufferTimer > 0 && this.dashCooldown <= 0) {
      this.dashBufferTimer = 0;
      this.dashTimer = GAME_CONSTANTS.DASH_DURATION_SEC;
      this.dashGraceTimer = 0.42;
      this.dashCooldown = this.modifiers.dashCooldownSec;
      this.accumulatedTurn = 0;
      this.playerSquashX = 1.24;
      this.playerSquashY = 0.78;
      audioManager.playDash();

      for (let i = 0; i < 6; i++) {
        const backAng = this.playerAngle + Math.PI + Phaser.Math.FloatBetween(-0.6, 0.6);
        this.spawnParticle(
          this.playerX,
          this.playerY,
          Math.cos(backAng) * Phaser.Math.FloatBetween(90, 210),
          Math.sin(backAng) * Phaser.Math.FloatBetween(90, 210),
          0.32,
          0.6,
          0.08,
          this.isFever ? 0x06d6a0 : 0xffb703
        );
      }
    }

    // Read directional intent (Keyboard WASD/Arrows OR Mouse Cursor)
    let dirX = 0;
    let dirY = 0;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) dirY -= 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) dirY += 1;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) dirX -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) dirX += 1;

    let hasMoveIntent = false;
    let targetAngle = this.playerAngle;

    if (dirX !== 0 || dirY !== 0) {
      const len = Math.hypot(dirX, dirY);
      dirX /= len;
      dirY /= len;
      targetAngle = Math.atan2(dirY, dirX);
      hasMoveIntent = true;
    } else if (this.mouseSteeringActive) {
      const mdx = this.mouseWorldX - this.playerX;
      const mdy = this.mouseWorldY - this.playerY;
      const mdist = Math.hypot(mdx, mdy);
      if (mdist > 14) {
        dirX = mdx / mdist;
        dirY = mdy / mdist;
        targetAngle = Math.atan2(dirY, dirX);
        hasMoveIntent = true;
      }
    }

    // Smooth responsive steering + track sharp turn delta for Drift Whip
    if (hasMoveIntent) {
      const turnRate = this.dashTimer > 0 ? 15.5 : 11.5;
      const diff = angleDelta(this.playerAngle, targetAngle);
      const step = Phaser.Math.Clamp(diff, -turnRate * dt, turnRate * dt);
      this.playerAngle = normalizeAngle(this.playerAngle + step);

      if (this.dashTimer > 0 || this.dashGraceTimer > 0) {
        this.accumulatedTurn += step;
      } else {
        this.accumulatedTurn *= Math.max(0, 1 - dt * 6);
      }
    }

    // Speed calculation
    let speed = GAME_CONSTANTS.BASE_PLAYER_SPEED * this.modifiers.moveSpeedMult;
    if (this.isFever) speed *= GAME_CONSTANTS.FEVER_SPEED_MULT;
    if (this.dashTimer > 0) speed *= GAME_CONSTANTS.DASH_SPEED_MULT;

    const moveFactor = hasMoveIntent ? 1 : this.dashTimer > 0 ? 1 : 0;
    const stepDx = Math.cos(this.playerAngle) * speed * moveFactor * dt;
    const stepDy = Math.sin(this.playerAngle) * speed * moveFactor * dt;

    const resolved = moveWithObstacleSubsteps(
      this.playerX,
      this.playerY,
      stepDx,
      stepDy,
      20,
      ARENA_BOUNDS
    );
    this.playerDistTraveled += distanceBetween({ x: this.playerX, y: this.playerY }, resolved);
    this.playerX = resolved.x;
    this.playerY = resolved.y;

    // Step snake-chain physics
    const { tipSpeed } = stepChainPhysics(
      { x: this.playerX, y: this.playerY },
      this.segments,
      GAME_CONSTANTS.SEGMENT_SPACING,
      dt,
      this.dashTimer > 0 || this.dashGraceTimer > 0,
      ARENA_BOUNDS
    );

    // Check Drift Whip trigger (10s skill cooldown)
    if (
      canActivateWhip(this.whipCooldown, this.whipTimer, this.isFever, this.segments.length) &&
      shouldTriggerDriftWhip({
        isDashing: this.dashTimer > 0,
        dashGraceTimer: this.dashGraceTimer,
        accumulatedTurnRad: this.accumulatedTurn,
        tipSpeed,
        segmentsCount: this.segments.length,
      })
    ) {
      this.whipTimer = GAME_CONSTANTS.WHIP_ACTIVE_DURATION_SEC;
      this.whipCooldown = this.modifiers.whipCooldownSec;
      this.accumulatedTurn = 0;
      audioManager.playWhipActivate();
      this.emitHud(true);
    }

    // Record tail tip ribbon trail when whipping or fever
    if (this.segments.length > 0 && (this.whipTimer > 0 || this.dashTimer > 0 || this.isFever)) {
      const tip = this.segments[this.segments.length - 1];
      this.tailTrailPoints.push({ x: tip.x, y: tip.y, life: 0.28 });
      if (this.tailTrailPoints.length > 26) {
        this.tailTrailPoints.shift();
      }
      if (this.whipTimer > 0 && Math.random() < dt * 45) {
        this.spawnParticle(
          tip.x,
          tip.y,
          Phaser.Math.FloatBetween(-60, 60),
          Phaser.Math.FloatBetween(-60, 60),
          0.25,
          0.55,
          0.05,
          0xffe66d
        );
      }
    }

    // Decay trail points
    for (let i = this.tailTrailPoints.length - 1; i >= 0; i--) {
      this.tailTrailPoints[i].life -= dt;
      if (this.tailTrailPoints[i].life <= 0) {
        this.tailTrailPoints.splice(i, 1);
      }
    }

    // Check Drift Whip hitting Thầy Thuốc
    if (this.whipTimer > 0 && this.whipHitCooldown <= 0 && this.segments.length > 0) {
      const whipRadius = GAME_CONSTANTS.BASE_WHIP_RADIUS * this.modifiers.whipRadiusMult + (this.wave === 3 ? 16 : 0);
      const checkIndices = [this.segments.length - 1];
      if (this.segments.length >= 2) checkIndices.push(this.segments.length - 2);

      for (const idx of checkIndices) {
        const seg = this.segments[idx];
        const dist = distanceBetween(seg, { x: this.bossX, y: this.bossY });
        if (dist <= whipRadius + 28) {
          this.onDriftWhipHitBoss(seg.x, seg.y);
          break;
        }
      }
    }

    this.syncActorVisuals(dt);
  }

  private onDriftWhipHitBoss(hitX: number, hitY: number): void {
    this.whipHitCooldown = 0.65;
    this.bossStunTimer = Math.max(this.bossStunTimer, this.modifiers.whipStunSec);
    this.bossLungeState = 'chase';
    this.bossHitFlashTimer = 0.16;

    // Knockback away from tail tip
    const ang = Math.atan2(this.bossY - hitY, this.bossX - hitX);
    this.bossVx = Math.cos(ang) * 460;
    this.bossVy = Math.sin(ang) * 460;

    // Weight-scaled juice: 45ms hitstop + decaying trauma shake + 22 neon firework particles
    this.hitstopTimer = 0.045;
    this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.55);
    audioManager.playWhipStun();

    const pts = calculateActionPoints(GAME_CONSTANTS.SCORE_WHIP_STUN, this.modifiers.scoreMultiplier);
    this.score += pts;
    this.stats.whipHits += 1;

    this.spawnFloatingText(this.bossX, this.bossY - 55, `QUẤT TRÚNG! +${pts}`, '#FFE66D');

    // Burst particles
    for (let i = 0; i < 22; i++) {
      const a = (Math.PI * 2 * i) / 22 + Phaser.Math.FloatBetween(-0.15, 0.15);
      const spd = Phaser.Math.FloatBetween(110, 320);
      this.spawnParticle(
        this.bossX,
        this.bossY,
        Math.cos(a) * spd,
        Math.sin(a) * spd,
        Phaser.Math.FloatBetween(0.32, 0.58),
        0.9,
        0.08,
        i % 2 === 0 ? 0xffb703 : 0x06d6a0
      );
    }

    // Drop 4 bonus Cloud Energy Orbs around Thầy Thuốc
    for (let i = 0; i < 4; i++) {
      const dropAng = (Math.PI * 2 * i) / 4 + Math.random() * 0.5;
      const dist = Phaser.Math.FloatBetween(68, 118);
      const pos = resolveArenaPosition(
        this.bossX + Math.cos(dropAng) * dist,
        this.bossY + Math.sin(dropAng) * dist,
        24,
        ARENA_BOUNDS
      );
      this.spawnCloudOrbAt(pos.x, pos.y);
    }

    this.emitHud(true);
  }

  private updateFever(dt: number): void {
    if (!this.isFever) return;
    this.feverTimer -= dt;
    this.cloudPercent = Math.max(0, (this.feverTimer / GAME_CONSTANTS.FEVER_DURATION_SEC) * 100);

    // Emit radiant dragon sparkles along body
    if (Math.random() < dt * 36) {
      const pick =
        this.segments.length > 0 && Math.random() < 0.7
          ? this.segments[Math.floor(Math.random() * this.segments.length)]
          : { x: this.playerX, y: this.playerY };
      this.spawnParticle(
        pick.x + Phaser.Math.FloatBetween(-16, 16),
        pick.y + Phaser.Math.FloatBetween(-16, 16),
        Phaser.Math.FloatBetween(-50, 50),
        Phaser.Math.FloatBetween(-70, -15),
        0.4,
        0.85,
        0.05,
        Math.random() < 0.5 ? 0x06d6a0 : 0xffb703
      );
    }

    if (this.feverTimer <= 0) {
      this.endFeverMode();
    }
  }

  private triggerFeverMode(): void {
    if (this.isFever) return;
    this.isFever = true;
    this.feverTimer = GAME_CONSTANTS.FEVER_DURATION_SEC;
    this.cloudPercent = 100;
    this.stats.feverTriggers += 1;
    this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.5);
    this.moodOverlay.setFillStyle(0x220845, 0.36);

    // Transform Cô Tấm into Luminous Vietnamese Dragon (Rồng Ánh Sáng)
    this.playerSprite.setTexture('dragon_head').setFlipX(false).setRotation(this.playerAngle);
    this.playerSquashX = 1.42;
    this.playerSquashY = 1.42;
    this.rebuildSegmentSprites();

    audioManager.playFeverStart();
    audioManager.setMusicState({ playing: true, paused: false, fever: true, wave: this.wave });

    this.showBanner('LÊN MÂY! HÓA RỒNG ÁNH SÁNG — HÚC THẦY THUỐC!', 2.2);
    this.spawnFloatingText(this.playerX, this.playerY - 62, 'HÓA RỒNG LÊN MÂY!', '#06D6A0');

    for (let i = 0; i < 28; i++) {
      const a = (Math.PI * 2 * i) / 28;
      this.spawnParticle(
        this.playerX,
        this.playerY,
        Math.cos(a) * Phaser.Math.FloatBetween(140, 340),
        Math.sin(a) * Phaser.Math.FloatBetween(140, 340),
        0.55,
        1.05,
        0.1,
        i % 2 === 0 ? 0x06d6a0 : 0xffb703
      );
    }

    this.emitHud(true);
  }

  private endFeverMode(): void {
    this.isFever = false;
    this.cloudPercent = 0;
    this.invulnTimer = Math.max(this.invulnTimer, 1.2);
    this.moodOverlay.setFillStyle(0x120e1f, 0.24);

    // Revert dragon back to Cô Tấm & Đông Hồ lantern tail
    this.playerSprite.setTexture('player_cotam').setRotation(0);
    this.playerSquashX = 1.22;
    this.playerSquashY = 0.84;
    this.rebuildSegmentSprites();

    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14;
      this.spawnParticle(
        this.playerX,
        this.playerY,
        Math.cos(a) * Phaser.Math.FloatBetween(80, 180),
        Math.sin(a) * Phaser.Math.FloatBetween(80, 180),
        0.38,
        0.8,
        0.08,
        i % 2 === 0 ? 0xffb703 : 0xffffff
      );
    }

    // Push Thầy Thuốc back to a fair distance so ending Fever never causes an instant cheap hit
    const dist = distanceBetween({ x: this.playerX, y: this.playerY }, { x: this.bossX, y: this.bossY });
    if (dist < 260) {
      const pushAng = Math.atan2(this.bossY - this.playerY, this.bossX - this.playerX);
      const safeBoss = resolveArenaPosition(
        this.playerX + Math.cos(pushAng) * 280,
        this.playerY + Math.sin(pushAng) * 280,
        36,
        ARENA_BOUNDS
      );
      this.bossX = safeBoss.x;
      this.bossY = safeBoss.y;
    }

    audioManager.setMusicState({ playing: true, paused: false, fever: false, wave: this.wave });
    this.emitHud(true);
  }

  private updateBossAI(dt: number): void {
    if (this.bossRamCooldown > 0) this.bossRamCooldown = Math.max(0, this.bossRamCooldown - dt);
    if (this.bossEntranceGrace > 0) this.bossEntranceGrace = Math.max(0, this.bossEntranceGrace - dt);
    if (this.bossPathTimer > 0) this.bossPathTimer = Math.max(0, this.bossPathTimer - dt);

    const bossColliderRadius = this.wave === 3 ? 28 : 24;

    // Apply knockback velocity decay with sub-stepped obstacle collision
    if (Math.hypot(this.bossVx, this.bossVy) > 8) {
      const next = moveWithObstacleSubsteps(
        this.bossX,
        this.bossY,
        this.bossVx * dt,
        this.bossVy * dt,
        bossColliderRadius,
        ARENA_BOUNDS
      );
      this.bossX = next.x;
      this.bossY = next.y;
      const damp = Math.exp(-7.5 * dt);
      this.bossVx *= damp;
      this.bossVy *= damp;
    }

    const baseSpeed = getEffectiveBossSpeed(this.wave, this.modifiers.bossEnrageLevel);

    const stepBossAlongPath = (goal: Vec2, moveSpeed: number) => {
      if (this.bossPathTimer <= 0 || this.bossPath.length === 0) {
        this.bossPath = findPathAroundObstacles(
          { x: this.bossX, y: this.bossY },
          goal,
          bossColliderRadius,
          ARENA_BOUNDS
        );
        this.bossPathTimer = 0.14;
      }

      // Advance past reached waypoints cleanly
      while (
        this.bossPath.length > 1 &&
        distanceBetween({ x: this.bossX, y: this.bossY }, this.bossPath[0]) < 22
      ) {
        this.bossPath.shift();
      }

      const wp = this.bossPath[0] ?? goal;
      const dx = wp.x - this.bossX;
      const dy = wp.y - this.bossY;
      const dist = Math.hypot(dx, dy);
      if (dist > 2) {
        const prevX = this.bossX;
        const prevY = this.bossY;
        const resolved = moveWithObstacleSubsteps(
          this.bossX,
          this.bossY,
          (dx / dist) * moveSpeed * dt,
          (dy / dist) * moveSpeed * dt,
          bossColliderRadius,
          ARENA_BOUNDS
        );
        this.bossX = resolved.x;
        this.bossY = resolved.y;

        // Anti-stall safeguard: if a corner blocked progress, force immediate A* replan on next tick
        if (Math.hypot(this.bossX - prevX, this.bossY - prevY) < moveSpeed * dt * 0.25) {
          this.bossPathTimer = 0;
        }
      }
    };

    if (this.bossStunTimer > 0) {
      this.bossStunTimer = Math.max(0, this.bossStunTimer - dt);
      this.bossSprite.setAngle(Math.sin(this.time.now * 0.025) * 14);
    } else {
      this.bossSprite.setAngle(0);

      if (this.isFever) {
        // Role reversal! Thầy Thuốc flees along the courtyard road network away from Cô Tấm
        const fleeGoal = findFleeWaypointTarget(
          { x: this.bossX, y: this.bossY },
          { x: this.playerX, y: this.playerY },
          bossColliderRadius,
          ARENA_BOUNDS
        );
        stepBossAlongPath(fleeGoal, baseSpeed * 0.78);
        this.bossLungeState = 'chase';
      } else {
        // Target the glowing tail tip (classic Rồng Rắn Lên Mây!) or head if 0 segments remain
        const target =
          this.segments.length > 0
            ? this.segments[this.segments.length - 1]
            : { x: this.playerX, y: this.playerY };

        if (this.bossLungeState === 'chase') {
          const dx = target.x - this.bossX;
          const dy = target.y - this.bossY;
          const dist = Math.hypot(dx, dy);
          if (dist > 4) {
            const speedNow = this.bossEntranceGrace > 0 ? baseSpeed * 0.58 : baseSpeed;
            stepBossAlongPath(target, speedNow);
          }

          // Initiate telegraphed Lunge Attack only when the full sightline to target is clear of obstacles
          if (this.bossEntranceGrace <= 0) {
            this.bossLungeCooldown -= dt;
            if (this.bossLungeCooldown <= 0 && dist < 420 && dist > 115) {
              const sightClear = isSegmentClearOfObstacles(
                { x: this.bossX, y: this.bossY },
                target,
                bossColliderRadius,
                ARENA_BOUNDS
              );
              if (sightClear) {
                this.bossLungeState = 'windup';
                this.bossLungeTimer = GAME_CONSTANTS.BOSS_LUNGE_WINDUP_SEC;
                this.bossLungeDirX = dx / Math.max(1, dist);
                this.bossLungeDirY = dy / Math.max(1, dist);
                this.bossPath = [];
                audioManager.playTelegraphWarn();
              }
            }
          }
        } else if (this.bossLungeState === 'windup') {
          this.bossLungeTimer -= dt;
          if (this.bossLungeTimer > 0.22) {
            const dx = target.x - this.bossX;
            const dy = target.y - this.bossY;
            const d = Math.max(1, Math.hypot(dx, dy));
            this.bossLungeDirX = dx / d;
            this.bossLungeDirY = dy / d;
          }
          if (this.bossLungeTimer <= 0) {
            this.bossLungeState = 'lunge';
            this.bossLungeTimer = GAME_CONSTANTS.BOSS_LUNGE_DURATION_SEC;
            audioManager.playDash();
          }
        } else if (this.bossLungeState === 'lunge') {
          this.bossLungeTimer -= dt;
          const lungeSpd = baseSpeed * GAME_CONSTANTS.BOSS_LUNGE_SPEED_MULT;
          const resolved = moveWithObstacleSubsteps(
            this.bossX,
            this.bossY,
            this.bossLungeDirX * lungeSpd * dt,
            this.bossLungeDirY * lungeSpd * dt,
            bossColliderRadius,
            ARENA_BOUNDS
          );
          this.bossX = resolved.x;
          this.bossY = resolved.y;
          if (Math.random() < dt * 40) {
            this.spawnParticle(this.bossX, this.bossY, 0, 0, 0.22, 0.7, 0.08, 0x9b5de5);
          }
          if (this.bossLungeTimer <= 0) {
            this.bossLungeState = 'chase';
            this.bossPathTimer = 0;
            const cfg = WAVE_CONFIGS[this.wave];
            this.bossLungeCooldown = Math.max(2.6, cfg.bossLungeCooldown - this.modifiers.bossEnrageLevel * 0.45);
          }
        }
      }
    }

    // Collision: Fever Dragon Ramming Thầy Thuốc
    const bossHitRadius = this.wave === 3 ? 52 : 38;
    if (this.isFever && this.bossRamCooldown <= 0) {
      const distHead = distanceBetween({ x: this.playerX, y: this.playerY }, { x: this.bossX, y: this.bossY });
      if (distHead <= bossHitRadius + 34) {
        this.onFeverRamBoss();
      }
      return;
    }

    // Collision: Thầy Thuốc biting Tail or Head (only when not stunned, not fever, not invulnerable, and not whipping)
    if (!this.isFever && this.bossStunTimer <= 0 && this.invulnTimer <= 0 && this.bossEntranceGrace <= 0) {
      // Check tail segments first (immune during active whip frames)
      if (this.segments.length > 0) {
        if (this.whipTimer <= 0) {
          for (let i = this.segments.length - 1; i >= 0; i--) {
            const seg = this.segments[i];
            if (distanceBetween(seg, { x: this.bossX, y: this.bossY }) <= bossHitRadius + 16) {
              this.damagePlayerOrSeverTail(seg.x, seg.y);
              return;
            }
          }
        }
      } else {
        // 0 segments left: touching Cô Tấm causes Game Over!
        if (distanceBetween({ x: this.playerX, y: this.playerY }, { x: this.bossX, y: this.bossY }) <= bossHitRadius + 22) {
          this.damagePlayerOrSeverTail(this.playerX, this.playerY);
        }
      }
    }
  }

  private onFeverRamBoss(): void {
    this.bossRamCooldown = GAME_CONSTANTS.FEVER_RAM_COOLDOWN_SEC;
    this.bossHitFlashTimer = 0.16;
    this.hitstopTimer = 0.05;
    this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.65);
    audioManager.playFeverRam();

    const ramPts = calculateActionPoints(GAME_CONSTANTS.SCORE_FEVER_RAM, this.modifiers.scoreMultiplier);
    this.score += ramPts;

    // Push Boss away
    const ang = Math.atan2(this.bossY - this.playerY, this.bossX - this.playerX);
    this.bossVx = Math.cos(ang) * 420;
    this.bossVy = Math.sin(ang) * 420;

    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = Phaser.Math.FloatBetween(120, 320);
      this.spawnParticle(
        this.bossX,
        this.bossY,
        Math.cos(a) * spd,
        Math.sin(a) * spd,
        0.45,
        0.95,
        0.08,
        i % 2 === 0 ? 0x06d6a0 : 0xffb703
      );
    }

    if (this.wave === 3) {
      const dmg = calculateFeverRamDamage(this.segments.length);
      this.bossHp = Math.max(0, this.bossHp - dmg);
      this.stats.bossHpRemaining = this.bossHp;
      this.spawnFloatingText(this.bossX, this.bossY - 62, `-${dmg} HP · +${ramPts}`, '#06D6A0');

      if (this.bossHp <= 0) {
        this.triggerVictoryBeat();
      }
    } else {
      this.bossStunTimer = Math.max(this.bossStunTimer, 1.0);
      this.spawnFloatingText(this.bossX, this.bossY - 62, `RỒNG HÚC! +${ramPts}`, '#06D6A0');
    }

    this.emitHud(true);
  }

  private damagePlayerOrSeverTail(hitX: number, hitY: number): void {
    if (this.invulnTimer > 0 || this.isFever) return;

    this.hitstopTimer = 0.05;
    this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.72);
    this.damageFlashAlpha = 0.52;
    audioManager.playSegmentBreak();

    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = Phaser.Math.FloatBetween(80, 240);
      this.spawnParticle(hitX, hitY, Math.cos(a) * spd, Math.sin(a) * spd, 0.45, 0.85, 0.08, 0xe63946);
    }

    if (this.segments.length > 0) {
      // Sever 1 tail segment + grant 1.5s i-frames
      this.segments.pop();
      this.stats.segmentsRemaining = this.segments.length;
      this.rebuildSegmentSprites();
      this.invulnTimer = GAME_CONSTANTS.INVULNERABLE_DURATION_SEC;
      this.spawnFloatingText(hitX, hitY - 40, 'ĐỨT 1 KHÚC!', '#E63946');
      this.emitHud(true);
    } else {
      // 0 segments left + hit again => Game Over!
      this.triggerDefeatBeat();
    }
  }

  private updateCloudOrbs(dt: number): void {
    const cfg = WAVE_CONFIGS[this.wave];
    this.cloudSpawnTimer -= dt;
    if (this.cloudSpawnTimer <= 0 && this.clouds.length < 10) {
      this.cloudSpawnTimer = cfg.cloudSpawnInterval;
      this.spawnRandomCloudOrb();
    }

    if (this.cloudComboResetTimer > 0) {
      this.cloudComboResetTimer -= dt;
      if (this.cloudComboResetTimer <= 0) this.cloudCombo = 0;
    }

    const magnetRadius = GAME_CONSTANTS.BASE_MAGNET_RADIUS * this.modifiers.cloudMagnetRadiusMult;

    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const orb = this.clouds[i];
      orb.bobPhase += dt * 4.2;

      const dx = this.playerX - orb.x;
      const dy = this.playerY - orb.y;
      const dist = Math.hypot(dx, dy);

      // Auto-magnet toward Cô Tấm when nearby
      if (dist < magnetRadius) {
        const pullSpeed = 480 * (1 - dist / (magnetRadius * 1.15)) + 160;
        orb.x += (dx / Math.max(1, dist)) * pullSpeed * dt;
        orb.y += (dy / Math.max(1, dist)) * pullSpeed * dt;
      }

      orb.sprite.setPosition(orb.x, orb.y + Math.sin(orb.bobPhase) * 4);
      orb.sprite.setScale(0.86 + Math.sin(orb.bobPhase * 1.4) * 0.08);

      if (dist <= 38) {
        orb.sprite.destroy();
        this.clouds.splice(i, 1);
        this.onCollectCloudOrb();
      }
    }
  }

  private onCollectCloudOrb(): void {
    const pts = calculateActionPoints(GAME_CONSTANTS.SCORE_CLOUD_ORB, this.modifiers.scoreMultiplier);
    this.score += pts;
    this.stats.cloudsCollected += 1;
    this.cloudCombo += 1;
    this.cloudComboResetTimer = 2.0;

    audioManager.playCloudPickup(this.cloudCombo);

    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      this.spawnParticle(
        this.playerX,
        this.playerY,
        Math.cos(a) * Phaser.Math.FloatBetween(60, 140),
        Math.sin(a) * Phaser.Math.FloatBetween(60, 140),
        0.28,
        0.55,
        0.05,
        0x06d6a0
      );
    }

    if (!this.isFever) {
      const gain = GAME_CONSTANTS.CLOUD_CHARGE_PER_ORB * this.modifiers.cloudChargeMult;
      this.cloudPercent = Math.min(100, this.cloudPercent + gain);
      if (this.cloudPercent >= 100) {
        this.triggerFeverMode();
      }
    }

    this.emitHud(true);
  }

  private spawnRandomCloudOrb(): void {
    for (let tries = 0; tries < 28; tries++) {
      const x = Phaser.Math.Between(ARENA_BOUNDS.minX + 26, ARENA_BOUNDS.maxX - 26);
      const y = Phaser.Math.Between(ARENA_BOUNDS.minY + 26, ARENA_BOUNDS.maxY - 26);
      const distPlayer = distanceBetween({ x, y }, { x: this.playerX, y: this.playerY });
      if (distPlayer > 110 && isPointClearOfObstacles(x, y, 22, ARENA_BOUNDS)) {
        this.spawnCloudOrbAt(x, y);
        return;
      }
    }
  }

  private spawnCloudOrbAt(x: number, y: number): void {
    const sprite = this.add.image(x, y, 'cloud_orb').setScale(0.88).setDepth(8);
    this.clouds.push({
      x,
      y,
      vx: 0,
      vy: 0,
      bobPhase: Math.random() * Math.PI * 2,
      sprite,
    });
  }

  private updateHealItems(dt: number): void {
    this.healSpawnTimer -= dt;
    if (this.healSpawnTimer <= 0) {
      this.healSpawnTimer = GAME_CONSTANTS.HEAL_ITEM_SPAWN_INTERVAL_SEC;
      if (this.healItems.length < GAME_CONSTANTS.HEAL_ITEM_MAX_ACTIVE) {
        this.spawnRandomHealItem();
      }
    }

    for (let i = this.healItems.length - 1; i >= 0; i--) {
      const item = this.healItems[i];
      item.bobPhase += dt * 3.8;

      const dx = this.playerX - item.x;
      const dy = this.playerY - item.y;
      const dist = Math.hypot(dx, dy);

      // Gentle magnetic pull when Cô Tấm passes close by
      if (dist < 84) {
        const pullSpeed = 320;
        item.x += (dx / Math.max(1, dist)) * pullSpeed * dt;
        item.y += (dy / Math.max(1, dist)) * pullSpeed * dt;
      }

      item.sprite.setPosition(item.x, item.y + Math.sin(item.bobPhase) * 4.5);
      item.sprite.setScale(0.94 + Math.sin(item.bobPhase * 1.5) * 0.08);

      if (dist <= 40) {
        const pickupX = item.x;
        const pickupY = item.y;
        item.sprite.destroy();
        this.healItems.splice(i, 1);
        this.onCollectHealItem(pickupX, pickupY);
      }
    }
  }

  private spawnRandomHealItem(): void {
    for (let tries = 0; tries < 32; tries++) {
      const x = Phaser.Math.Between(ARENA_BOUNDS.minX + 34, ARENA_BOUNDS.maxX - 34);
      const y = Phaser.Math.Between(ARENA_BOUNDS.minY + 34, ARENA_BOUNDS.maxY - 34);
      const distPlayer = distanceBetween({ x, y }, { x: this.playerX, y: this.playerY });
      if (distPlayer > 130 && isPointClearOfObstacles(x, y, 26, ARENA_BOUNDS)) {
        const sprite = this.add.image(x, y, 'heal_lantern').setScale(0.94).setDepth(9);
        this.healItems.push({
          x,
          y,
          bobPhase: Math.random() * Math.PI * 2,
          sprite,
        });
        this.spawnFloatingText(x, y - 36, 'HỒI KHÚC!', '#FF85A1');
        for (let k = 0; k < 8; k++) {
          const a = (Math.PI * 2 * k) / 8;
          this.spawnParticle(x, y, Math.cos(a) * 90, Math.sin(a) * 90, 0.38, 0.7, 0.08, 0xffb703);
        }
        this.emitHud(true);
        return;
      }
    }
  }

  private onCollectHealItem(x: number, y: number): void {
    const result = applyHealSegmentPickup(
      this.segments.length,
      GAME_CONSTANTS.INITIAL_SEGMENTS,
      this.modifiers.scoreMultiplier
    );
    this.score += result.bonusScore;
    audioManager.playHealSegment();

    if (result.restored) {
      const anchor =
        this.segments.length > 0
          ? this.segments[this.segments.length - 1]
          : { x: this.playerX, y: this.playerY };
      const prevAnchor =
        this.segments.length > 1
          ? this.segments[this.segments.length - 2]
          : { x: this.playerX, y: this.playerY };
      const backAngle =
        this.segments.length > 0
          ? Math.atan2(anchor.y - prevAnchor.y, anchor.x - prevAnchor.x)
          : this.playerAngle + Math.PI;
      const safePos = resolveArenaPosition(
        anchor.x + Math.cos(backAngle) * GAME_CONSTANTS.SEGMENT_SPACING,
        anchor.y + Math.sin(backAngle) * GAME_CONSTANTS.SEGMENT_SPACING,
        16,
        ARENA_BOUNDS
      );
      this.segments.push({ x: safePos.x, y: safePos.y, vx: 0, vy: 0, angle: normalizeAngle(backAngle + Math.PI) });
      this.stats.segmentsRemaining = this.segments.length;
      this.rebuildSegmentSprites();

      this.spawnFloatingText(x, y - 42, '+1 KHÚC ĐUÔI!', '#06D6A0');
      for (let i = 0; i < 14; i++) {
        const a = (Math.PI * 2 * i) / 14;
        const spd = Phaser.Math.FloatBetween(85, 210);
        this.spawnParticle(x, y, Math.cos(a) * spd, Math.sin(a) * spd, 0.42, 0.85, 0.08, i % 2 === 0 ? 0x06d6a0 : 0xffb703);
      }
    } else {
      if (!this.isFever && result.bonusCloudPercent > 0) {
        this.cloudPercent = Math.min(100, this.cloudPercent + result.bonusCloudPercent);
        if (this.cloudPercent >= 100) {
          this.triggerFeverMode();
        }
      }
      this.spawnFloatingText(x, y - 42, `ĐẦY KHÚC! +${result.bonusScore}`, '#FFE66D');
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI * 2 * i) / 10;
        const spd = Phaser.Math.FloatBetween(75, 175);
        this.spawnParticle(x, y, Math.cos(a) * spd, Math.sin(a) * spd, 0.36, 0.75, 0.08, 0xffb703);
      }
    }

    this.emitHud(true);
  }

  private updateTalismans(dt: number): void {
    const cfg = WAVE_CONFIGS[this.wave];
    if (cfg.talismanCooldown > 0 && !this.isFever && this.bossStunTimer <= 0) {
      this.talismanSpawnTimer -= dt;
      if (this.talismanSpawnTimer <= 0) {
        const rateBoost = Math.pow(0.88, this.modifiers.bossEnrageLevel);
        this.talismanSpawnTimer = Math.max(2.1, cfg.talismanCooldown * rateBoost);
        this.throwTalismans(cfg.talismanCount);
      }
    }

    for (let i = this.talismans.length - 1; i >= 0; i--) {
      const tal = this.talismans[i];
      tal.timer -= dt;

      if (tal.state === 'telegraph') {
        tal.sprite.setAngle(tal.sprite.angle + dt * 260);
        tal.sprite.setAlpha(0.55 + Math.sin(this.time.now * 0.025) * 0.25);
        if (tal.timer <= 0) {
          tal.state = 'active';
          tal.timer = GAME_CONSTANTS.TALISMAN_ACTIVE_SEC;
          tal.sprite.setAlpha(1).setScale(1.05);
          for (let k = 0; k < 10; k++) {
            const a = (Math.PI * 2 * k) / 10;
            this.spawnParticle(
              tal.x,
              tal.y,
              Math.cos(a) * 95,
              Math.sin(a) * 95,
              0.35,
              0.65,
              0.08,
              0x9b5de5
            );
          }
        }
      } else {
        // Active toxic zone hurts tail or 0-segment head if stepped inside
        if (!this.isFever && this.invulnTimer <= 0) {
          if (this.segments.length > 0) {
            for (let s = this.segments.length - 1; s >= 0; s--) {
              if (distanceBetween(this.segments[s], tal) <= tal.radius) {
                this.damagePlayerOrSeverTail(this.segments[s].x, this.segments[s].y);
                break;
              }
            }
          } else if (distanceBetween({ x: this.playerX, y: this.playerY }, tal) <= tal.radius) {
            this.damagePlayerOrSeverTail(this.playerX, this.playerY);
          }
        }

        if (tal.timer <= 0) {
          tal.sprite.destroy();
          this.talismans.splice(i, 1);
        }
      }
    }
  }

  private throwTalismans(count: number): void {
    audioManager.playTelegraphWarn();
    for (let i = 0; i < count; i++) {
      // Place 1 near predicted player path and others around courtyard lanes
      const baseX = i === 0 ? this.playerX + Math.cos(this.playerAngle) * 145 : Phaser.Math.Between(240, 1200);
      const baseY = i === 0 ? this.playerY + Math.sin(this.playerAngle) * 145 : Phaser.Math.Between(160, 660);
      const pos = resolveArenaPosition(baseX, baseY, 45, ARENA_BOUNDS);
      const sprite = this.add.image(pos.x, pos.y, 'talisman_paper').setScale(0.75).setDepth(5);
      this.talismans.push({
        x: pos.x,
        y: pos.y,
        state: 'telegraph',
        timer: GAME_CONSTANTS.TALISMAN_TELEGRAPH_SEC,
        radius: GAME_CONSTANTS.TALISMAN_RADIUS,
        sprite,
      });
    }
  }

  private updateWisps(dt: number): void {
    for (const wisp of this.wisps) {
      wisp.orbitAngle += wisp.orbitSpeed * dt;
      wisp.x = ARENA_BOUNDS.banyanX + Math.cos(wisp.orbitAngle) * wisp.orbitRadius;
      wisp.y = ARENA_BOUNDS.banyanY + Math.sin(wisp.orbitAngle) * wisp.orbitRadius * 0.72;
      wisp.sprite.setPosition(wisp.x, wisp.y);
      wisp.sprite.setScale(0.92 + Math.sin(this.time.now * 0.008 + wisp.orbitAngle) * 0.1);

      if (!this.isFever && this.invulnTimer <= 0 && this.whipTimer <= 0) {
        if (this.segments.length > 0) {
          for (let s = this.segments.length - 1; s >= 0; s--) {
            if (distanceBetween(this.segments[s], wisp) <= 30) {
              this.damagePlayerOrSeverTail(this.segments[s].x, this.segments[s].y);
              break;
            }
          }
        } else if (distanceBetween({ x: this.playerX, y: this.playerY }, wisp) <= 32) {
          this.damagePlayerOrSeverTail(this.playerX, this.playerY);
        }
      }
    }
  }

  private updateWaveProgress(dt: number): void {
    if (this.wave === 3) return; // Wave 3 ends only when Boss HP hits 0

    this.waveTimeLeft = Math.max(0, this.waveTimeLeft - dt);
    if (this.waveTimeLeft <= 0) {
      this.score += GAME_CONSTANTS.SCORE_WAVE_CLEAR;
      this.openXinKhucEvent(this.wave);
    }
  }

  private openXinKhucEvent(completedWave: 1 | 2): void {
    this.mode = 'xinkhuc';
    this.keysHeld.clear();
    audioManager.setMusicState({ playing: true, paused: true });
    audioManager.playXinKhucBell();

    eventBus.emit('game:state', { state: 'paused' });
    eventBus.emit('xinkhuc:open', {
      waveCompleted: completedWave,
      segmentsCount: this.segments.length,
      canSacrifice: canSacrificeSegment(this.segments.length),
      buffChoices: pickBuffChoices(this.modifiers.appliedBuffs),
    });
    this.emitHud(true);
  }

  private handleXinKhucSelection(choice: 'sacrifice' | 'refuse', buffId?: 'wind_boots' | 'thunder_tail' | 'cloud_magnet'): void {
    const result = applyXinKhucChoice(this.segments.length, this.modifiers, choice, buffId);
    this.modifiers = result.nextModifiers;
    this.stats.buffs = [...this.modifiers.appliedBuffs];

    while (this.segments.length > result.nextSegments) {
      this.segments.pop();
    }
    this.stats.segmentsRemaining = this.segments.length;
    this.rebuildSegmentSprites();

    // Advance wave
    const nextWave = (this.wave + 1) as 2 | 3;
    this.wave = nextWave;
    this.stats.waveReached = nextWave;
    this.waveTimeLeft = WAVE_CONFIGS[nextWave].durationSec;
    this.talismanSpawnTimer = 2.0;
    this.bossLungeCooldown = WAVE_CONFIGS[nextWave].bossLungeCooldown;
    this.bossLungeState = 'chase';
    this.invulnTimer = 1.4;

    // Clear old talismans between waves
    this.talismans.forEach((t) => t.sprite.destroy());
    this.talismans = [];
    this.spawnWispsForWave(WAVE_CONFIGS[nextWave].wispCount);

    // Grow Boss dramatically in Wave 3
    if (nextWave === 3) {
      this.bossHp = GAME_CONSTANTS.BOSS_MAX_HP;
      this.stats.bossHpRemaining = this.bossHp;
      this.bossSprite.setScale(0.56);
      this.bossShadow.setScale(1.45);
      this.showBanner('ĐỢT 3 · TRẢM TRÙM THẦY THUỐC (1.000 HP)!', 2.8);
    } else {
      this.showBanner(
        choice === 'refuse'
          ? 'ĐỢT 2 · THẦY THUỐC NỔI ĐIÊN · x2 ĐIỂM THƯỞNG!'
          : 'ĐỢT 2 · ĐÃ NHẬN BÙA BUFF · BÙA ĐỘC XUẤT HIỆN!',
        2.6
      );
    }

    this.mode = 'playing';
    audioManager.setMusicState({ playing: true, paused: false, fever: this.isFever, wave: this.wave });
    eventBus.emit('game:state', { state: 'playing' });
    this.emitHud(true);
  }

  private triggerVictoryBeat(): void {
    this.mode = 'ko_beat';
    this.pendingVictory = true;
    this.koBeatTimer = 0.6;
    this.keysHeld.clear();
    this.shakeTrauma = 1.0;
    audioManager.setMusicState({ playing: false });
    audioManager.playVictory();

    for (let i = 0; i < 42; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = Phaser.Math.FloatBetween(110, 390);
      this.spawnParticle(
        this.bossX,
        this.bossY,
        Math.cos(a) * spd,
        Math.sin(a) * spd,
        Phaser.Math.FloatBetween(0.5, 0.9),
        1.2,
        0.1,
        i % 3 === 0 ? 0xffb703 : i % 3 === 1 ? 0x06d6a0 : 0xe63946
      );
    }
  }

  private triggerDefeatBeat(): void {
    this.mode = 'ko_beat';
    this.pendingVictory = false;
    this.koBeatTimer = 0.45;
    this.keysHeld.clear();
    audioManager.setMusicState({ playing: false });
    audioManager.playGameOver();
  }

  private finishRun(victory: boolean): void {
    this.mode = 'gameover';
    if (victory) {
      this.score += calculateVictorySegmentBonus(this.segments.length);
    }
    const finalScore = Math.round(this.score);
    const bestScore = saveHighScore(finalScore);
    const rank = computeRank(finalScore);

    const frozenStats: RunStats = {
      ...this.stats,
      segmentsRemaining: this.segments.length,
      bossHpRemaining: this.bossHp,
      buffs: [...this.modifiers.appliedBuffs],
    };

    const bossQuote = victory
      ? 'Ái chà! Rồng Ánh Sáng lợi hại quá, Thầy Thuốc xin chịu thua!'
      : 'Xin khúc không cho, giờ mất cả đoàn rồi nhé!';

    eventBus.emit('game:state', { state: 'gameover' });
    eventBus.emit('game:ended', {
      victory,
      score: finalScore,
      bestScore,
      rank,
      stats: frozenStats,
      bossQuote,
    });
  }

  private syncActorVisuals(dt: number): void {
    // Smooth squash-and-stretch recovery
    const damp = Math.exp(-12 * dt);
    this.playerSquashX = 1 + (this.playerSquashX - 1) * damp;
    this.playerSquashY = 1 + (this.playerSquashY - 1) * damp;

    // Distance-synced gait bob (dragon glides smoothly with subtle serpentine weave)
    const gaitBob = this.isFever
      ? Math.sin(this.time.now * 0.012) * 3.0
      : Math.sin(this.playerDistTraveled * 0.085) * 3.5;

    if (this.isFever) {
      const dragonScale = 0.84;
      const weave = Math.sin(this.time.now * 0.015) * 0.07;
      this.playerSprite.setPosition(this.playerX, this.playerY + gaitBob);
      this.playerSprite.setScale(dragonScale * this.playerSquashX, dragonScale * this.playerSquashY);
      this.playerSprite.setFlipX(false);
      this.playerSprite.setRotation(this.playerAngle + weave);
      this.playerShadow.setPosition(this.playerX, this.playerY + 30).setScale(1.38);
    } else {
      const baseScale = 0.32;
      this.playerSprite.setPosition(this.playerX, this.playerY + gaitBob);
      this.playerSprite.setScale(baseScale * this.playerSquashX, baseScale * this.playerSquashY);
      this.playerSprite.setRotation(0);
      this.playerSprite.setFlipX(Math.cos(this.playerAngle) < -0.15);
      this.playerShadow.setPosition(this.playerX, this.playerY + 24).setScale(1);
    }

    // Invulnerability blink
    if (this.mode === 'playing' && this.invulnTimer > 0 && !this.isFever) {
      this.playerSprite.setAlpha(Math.sin(this.time.now * 0.045) > 0 ? 1 : 0.32);
    } else {
      this.playerSprite.setAlpha(1);
    }

    // Update lantern / dragon body & tail segment sprites
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const sprite = this.segmentSprites[i];
      if (!sprite) continue;
      const isTip = i === this.segments.length - 1;
      const pulse = isTip ? 1 + Math.sin(this.time.now * 0.012) * 0.1 : 1;
      sprite.setPosition(seg.x, seg.y);
      if (this.isFever) {
        const dragonSegScale = isTip ? 1.02 * pulse : Math.max(0.72, 0.94 - i * 0.055);
        sprite.setScale(dragonSegScale);
        sprite.setRotation(seg.angle);
        sprite.setAlpha(1);
      } else {
        const segScale = isTip
          ? (this.whipTimer > 0 ? 1.18 : 0.88) * pulse
          : 0.74;
        sprite.setScale(segScale);
        sprite.setRotation(0);
        if (this.mode === 'playing' && this.invulnTimer > 0) {
          sprite.setAlpha(this.playerSprite.alpha);
        } else {
          sprite.setAlpha(1);
        }
      }
    }

    // Update Thầy Thuốc bob & facing
    const bossBob = Math.sin(this.time.now * 0.007) * 3;
    this.bossSprite.setPosition(this.bossX, this.bossY + bossBob);
    this.bossSprite.setFlipX(this.playerX < this.bossX);
    this.bossShadow.setPosition(this.bossX, this.bossY + (this.wave === 3 ? 42 : 30));
  }

  private renderWorldGraphics(_dt: number): void {
    this.telegraphGraphics.clear();
    this.spineGraphics.clear();
    this.fxGraphics.clear();

    const now = this.time.now;

    // 1. Subtle glowing elliptical ring matching the exact solid Banyan Tree ("Cây Đa") collider
    const treePulse = 0.24 + Math.sin(now * 0.004) * 0.08;
    const banyan = ARENA_BOUNDS.ellipses?.[0];
    this.telegraphGraphics.lineStyle(3, this.isFever ? 0x06d6a0 : 0xffb703, treePulse);
    if (banyan) {
      this.telegraphGraphics.strokeEllipse(banyan.cx, banyan.cy, banyan.rx * 2, banyan.ry * 2);
    } else {
      this.telegraphGraphics.strokeCircle(
        ARENA_BOUNDS.banyanX,
        ARENA_BOUNDS.banyanY,
        ARENA_BOUNDS.banyanRadius + 6
      );
    }

    // 1b. Pulsing beacon ring around active Hồi Khúc (Tail Segment Restore) items
    for (const item of this.healItems) {
      const pulseR = 26 + Math.sin(now * 0.008 + item.bobPhase) * 6;
      this.telegraphGraphics.lineStyle(3, 0xff4d6d, 0.75);
      this.telegraphGraphics.strokeCircle(item.x, item.y, pulseR);
      this.telegraphGraphics.lineStyle(2, 0xffe66d, 0.55);
      this.telegraphGraphics.strokeCircle(item.x, item.y, pulseR + 7);
    }

    // 2. Talisman telegraph & active poison rings
    for (const tal of this.talismans) {
      if (tal.state === 'telegraph') {
        const progress = 1 - tal.timer / GAME_CONSTANTS.TALISMAN_TELEGRAPH_SEC;
        this.telegraphGraphics.lineStyle(3, 0xffb703, 0.85);
        this.telegraphGraphics.strokeCircle(tal.x, tal.y, tal.radius);
        this.telegraphGraphics.fillStyle(0xe63946, 0.14 + progress * 0.2);
        this.telegraphGraphics.fillCircle(tal.x, tal.y, tal.radius * progress);
      } else {
        this.telegraphGraphics.fillStyle(0x9b5de5, 0.28 + Math.sin(now * 0.015) * 0.08);
        this.telegraphGraphics.fillCircle(tal.x, tal.y, tal.radius);
        this.telegraphGraphics.lineStyle(3, 0x38f9d7, 0.8);
        this.telegraphGraphics.strokeCircle(tal.x, tal.y, tal.radius);
      }
    }

    // 3. Boss Lunge Telegraph aim line & charge halo
    if (this.bossLungeState === 'windup' && this.mode === 'playing') {
      const pulse = 0.55 + Math.sin(now * 0.04) * 0.35;
      this.telegraphGraphics.lineStyle(5, 0xe63946, pulse);
      this.telegraphGraphics.lineBetween(
        this.bossX,
        this.bossY,
        this.bossX + this.bossLungeDirX * 260,
        this.bossY + this.bossLungeDirY * 260
      );
      this.telegraphGraphics.lineStyle(3, 0xffb703, 0.9);
      this.telegraphGraphics.strokeCircle(this.bossX, this.bossY, 54);
    }

    // 4. Glowing dragon spine connecting Cô Tấm -> all tail segments
    if (this.segments.length > 0) {
      const spineColor = this.isFever ? 0x06d6a0 : this.whipTimer > 0 ? 0xffe66d : 0xffb703;
      const spineWidth = this.isFever ? 18 : this.whipTimer > 0 ? 12 : 7;

      this.spineGraphics.lineStyle(spineWidth + 6, spineColor, 0.26);
      this.spineGraphics.beginPath();
      this.spineGraphics.moveTo(this.playerX, this.playerY);
      for (const seg of this.segments) {
        this.spineGraphics.lineTo(seg.x, seg.y);
      }
      this.spineGraphics.strokePath();

      this.spineGraphics.lineStyle(spineWidth * 0.55, 0xfff8dc, 0.9);
      this.spineGraphics.beginPath();
      this.spineGraphics.moveTo(this.playerX, this.playerY);
      for (const seg of this.segments) {
        this.spineGraphics.lineTo(seg.x, seg.y);
      }
      this.spineGraphics.strokePath();

      // Highlight glowing tail tip target / whip ring (jade when ready, muted while 10s cooldown ticks)
      const tip = this.segments[this.segments.length - 1];
      const whipReady = this.whipCooldown <= 0;
      const tipRadius = this.whipTimer > 0
        ? GAME_CONSTANTS.BASE_WHIP_RADIUS * this.modifiers.whipRadiusMult
        : 28 + Math.sin(now * 0.01) * 3;
      const ringColor = this.whipTimer > 0 ? 0xffe66d : whipReady ? 0x06d6a0 : 0x8b7aa8;
      const ringAlpha = this.whipTimer > 0 ? 0.95 : whipReady ? 0.78 : 0.45;
      this.fxGraphics.lineStyle(this.whipTimer > 0 ? 4 : 2.5, ringColor, ringAlpha);
      this.fxGraphics.strokeCircle(tip.x, tip.y, tipRadius);
    }

    // 5. Drift Whip / Fever energy ribbon trail
    if (this.tailTrailPoints.length >= 2) {
      for (let i = 1; i < this.tailTrailPoints.length; i++) {
        const prev = this.tailTrailPoints[i - 1];
        const curr = this.tailTrailPoints[i];
        const alpha = Math.max(0, curr.life / 0.28);
        this.fxGraphics.lineStyle(
          this.isFever ? 14 * alpha : 10 * alpha,
          this.isFever ? 0x06d6a0 : 0xffb703,
          alpha * 0.75
        );
        this.fxGraphics.lineBetween(prev.x, prev.y, curr.x, curr.y);
      }
    }

    // 6. Fever Dragon luminous aura + flowing animated golden dragon whiskers
    if (this.isFever) {
      const auraR = 48 + this.segments.length * 4 + Math.sin(now * 0.02) * 5;
      this.fxGraphics.lineStyle(3.5, 0x06d6a0, 0.72);
      this.fxGraphics.strokeCircle(this.playerX, this.playerY, auraR);
      this.fxGraphics.lineStyle(2, 0xffb703, 0.75);
      this.fxGraphics.strokeCircle(this.playerX, this.playerY, auraR + 10);

      // Animated twin flowing dragon whiskers streaming behind the snout
      const cosA = Math.cos(this.playerAngle);
      const sinA = Math.sin(this.playerAngle);
      const perpX = -sinA;
      const perpY = cosA;
      for (const side of [-1, 1]) {
        const startX = this.playerX + cosA * 32 + perpX * (side * 10);
        const startY = this.playerY + sinA * 32 + perpY * (side * 10);
        this.fxGraphics.lineStyle(2.6, 0xffe66d, 0.92);
        this.fxGraphics.beginPath();
        this.fxGraphics.moveTo(startX, startY);
        for (let step = 1; step <= 4; step++) {
          const back = step * 15;
          const wave = Math.sin(now * 0.018 - step * 1.1) * (5 + step * 1.8);
          const wx = startX - cosA * back + perpX * (side * (16 + step * 7) + wave);
          const wy = startY - sinA * back + perpY * (side * (16 + step * 7) + wave);
          this.fxGraphics.lineTo(wx, wy);
        }
        this.fxGraphics.strokePath();
      }
    }

    // 7. Boss white hit flash & Stun dizzy orbit stars
    if (this.bossHitFlashTimer > 0) {
      const flashAlpha = Math.min(0.85, (this.bossHitFlashTimer / 0.16) * 0.85);
      this.fxGraphics.fillStyle(0xffffff, flashAlpha);
      this.fxGraphics.fillCircle(this.bossX, this.bossY, this.wave === 3 ? 58 : 44);
    }

    if (this.bossStunTimer > 0) {
      for (let i = 0; i < 3; i++) {
        const a = now * 0.008 + (Math.PI * 2 * i) / 3;
        const sx = this.bossX + Math.cos(a) * 34;
        const sy = this.bossY - 48 + Math.sin(a) * 11;
        this.fxGraphics.fillStyle(0xffe66d, 1);
        this.fxGraphics.fillCircle(sx, sy, 6);
        this.fxGraphics.lineStyle(2, 0x120e1f, 0.9);
        this.fxGraphics.strokeCircle(sx, sy, 6);
      }
    }

    // 8. Red damage vignette flash on segment sever
    if (this.damageFlashAlpha > 0.01) {
      this.fxGraphics.lineStyle(22, 0xe63946, this.damageFlashAlpha);
      this.fxGraphics.strokeRect(
        11,
        11,
        GAME_CONSTANTS.WORLD_WIDTH - 22,
        GAME_CONSTANTS.WORLD_HEIGHT - 22
      );
    }
  }

  private resolveGlowTexture(tint: number): string {
    if (tint === 0x06d6a0) return 'glow_jade';
    if (tint === 0xe63946) return 'glow_red';
    if (tint === 0x9b5de5) return 'glow_purple';
    if (tint === 0xffffff) return 'glow_white';
    return 'glow_gold';
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    startScale: number,
    endScale: number,
    tint: number
  ): void {
    const p = this.particlePool[this.particleCursor];
    this.particleCursor = (this.particleCursor + 1) % this.particlePool.length;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.maxLife = life;
    p.startScale = startScale;
    p.endScale = endScale;
    p.sprite
      .setTexture(this.resolveGlowTexture(tint))
      .setPosition(x, y)
      .setScale(startScale)
      .setAlpha(1)
      .setVisible(true);
  }

  private updateParticles(dt: number): void {
    for (let i = 0; i < this.particlePool.length; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.sprite.setVisible(false);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      const t = 1 - p.life / p.maxLife;
      const scale = p.startScale + (p.endScale - p.startScale) * t;
      p.sprite.setPosition(p.x, p.y).setScale(scale).setAlpha(1 - t);
    }
  }

  private spawnFloatingText(x: number, y: number, label: string, color: string): void {
    const text = this.add
      .text(x, y, label, {
        fontFamily: '"Bricolage Grotesque", "Be Vietnam Pro", sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color,
        stroke: '#120e1f',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.floatingTexts.push({ text, vy: -52, life: 0.95, maxLife: 0.95 });
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const item = this.floatingTexts[i];
      item.life -= dt;
      item.text.y += item.vy * dt;
      item.text.setAlpha(Math.max(0, item.life / item.maxLife));
      if (item.life <= 0) {
        item.text.destroy();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private updateCameraShake(dt: number): void {
    if (this.shakeTrauma > 0) {
      this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.4);
      const power = this.shakeTrauma * this.shakeTrauma * 14;
      const ox = Phaser.Math.FloatBetween(-power, power);
      const oy = Phaser.Math.FloatBetween(-power, power);
      this.cameras.main.centerOn(GAME_CONSTANTS.WORLD_WIDTH / 2 + ox, GAME_CONSTANTS.WORLD_HEIGHT / 2 + oy);
    } else {
      this.cameras.main.centerOn(GAME_CONSTANTS.WORLD_WIDTH / 2, GAME_CONSTANTS.WORLD_HEIGHT / 2);
    }
  }

  private showBanner(text: string, durationSec: number): void {
    this.bannerText = text;
    this.bannerTimer = durationSec;
    this.emitHud(true);
  }

  private emitHud(force: boolean): void {
    const snapshot: HudSnapshot = {
      score: Math.round(this.score),
      multiplier: this.modifiers.scoreMultiplier,
      segmentsCount: this.segments.length,
      maxSegments: GAME_CONSTANTS.INITIAL_SEGMENTS,
      cloudPercent: Math.round(this.cloudPercent),
      wave: this.wave,
      waveTitle: WAVE_CONFIGS[this.wave].title,
      waveTimeLeft: Math.ceil(this.waveTimeLeft),
      bossHp: Math.round(this.bossHp),
      bossMaxHp: GAME_CONSTANTS.BOSS_MAX_HP,
      bossStunned: this.bossStunTimer > 0,
      isFever: this.isFever,
      feverTimeLeft: Number(this.feverTimer.toFixed(1)),
      dashCooldownRatio:
        this.dashCooldown <= 0 ? 1 : Math.max(0, 1 - this.dashCooldown / this.modifiers.dashCooldownSec),
      whipActive: this.whipTimer > 0,
      whipCooldownLeft: Math.ceil(this.whipCooldown),
      whipCooldownMax: Math.round(this.modifiers.whipCooldownSec),
      healItemNextSec: Math.max(1, Math.ceil(this.healSpawnTimer)),
      healItemActiveCount: this.healItems.length,
      appliedBuffs: [...this.modifiers.appliedBuffs],
      bannerText: this.bannerText,
    };

    const dashReady = snapshot.dashCooldownRatio >= 1 ? 1 : 0;
    const key = `${snapshot.score}|${snapshot.segmentsCount}|${snapshot.cloudPercent}|${snapshot.wave}|${snapshot.waveTimeLeft}|${snapshot.bossHp}|${snapshot.isFever}|${snapshot.whipActive}|${snapshot.whipCooldownLeft}|${snapshot.healItemNextSec}|${snapshot.healItemActiveCount}|${snapshot.bannerText ?? ''}|${dashReady}`;
    if (!force && key === this.lastHudKey) return;
    this.lastHudKey = key;
    eventBus.emit('hud:update', snapshot);
  }
}
