import { useCallback, useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { GAME_CONSTANTS, WAVE_CONFIGS, loadHighScore, type BuffId } from './core/game-rules';
import { createPhaserGame } from './game/phaser-config';
import {
  eventBus,
  type GameEndedPayload,
  type HudSnapshot,
  type XinKhucPayload,
} from './game/event-bus';
import { TitleScreen } from './components/TitleScreen';
import { GameHud } from './components/GameHud';
import { XinKhucModal } from './components/XinKhucModal';
import { PauseModal } from './components/PauseModal';
import { EndScreen } from './components/EndScreen';

type AppGameState = 'title' | 'playing' | 'paused' | 'gameover';

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  multiplier: 1,
  segmentsCount: GAME_CONSTANTS.INITIAL_SEGMENTS,
  maxSegments: GAME_CONSTANTS.INITIAL_SEGMENTS,
  cloudPercent: 0,
  wave: 1,
  waveTitle: WAVE_CONFIGS[1].title,
  waveTimeLeft: WAVE_CONFIGS[1].durationSec,
  bossHp: GAME_CONSTANTS.BOSS_MAX_HP,
  bossMaxHp: GAME_CONSTANTS.BOSS_MAX_HP,
  bossStunned: false,
  isFever: false,
  feverTimeLeft: 0,
  dashCooldownRatio: 1,
  whipActive: false,
  whipCooldownLeft: 0,
  whipCooldownMax: GAME_CONSTANTS.BASE_WHIP_COOLDOWN_SEC,
  healItemNextSec: GAME_CONSTANTS.HEAL_ITEM_SPAWN_INTERVAL_SEC,
  healItemActiveCount: 0,
  appliedBuffs: [],
  bannerText: null,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const [gameState, setGameState] = useState<AppGameState>('title');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [xinKhuc, setXinKhuc] = useState<XinKhucPayload | null>(null);
  const [endResult, setEndResult] = useState<GameEndedPayload | null>(null);
  const [muted, setMuted] = useState(false);
  const [bestScore, setBestScore] = useState(() => loadHighScore());

  // Sync game state machine to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Mount Phaser canvas once in an isolated sibling container
  useEffect(() => {
    const container = mountRef.current;
    if (!container || gameRef.current) return;

    const game = createPhaserGame(container);
    gameRef.current = game;

    const unsubs = [
      eventBus.on('hud:update', (snapshot) => {
        setHud(snapshot);
      }),
      eventBus.on('game:state', ({ state }) => {
        setGameState(state);
        if (state === 'playing') {
          setXinKhuc(null);
          setEndResult(null);
        }
        if (state === 'title') {
          setXinKhuc(null);
          setEndResult(null);
          setBestScore(loadHighScore());
        }
      }),
      eventBus.on('xinkhuc:open', (payload) => {
        setXinKhuc(payload);
      }),
      eventBus.on('game:ended', (payload) => {
        setEndResult(payload);
        setBestScore(payload.bestScore);
      }),
      eventBus.on('audio:muteChanged', ({ muted: nextMuted }) => {
        setMuted(nextMuted);
      }),
    ];

    return () => {
      unsubs.forEach((fn) => fn());
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const handleStart = useCallback(() => {
    document.body.dataset.state = 'playing';
    setGameState('playing');
    setXinKhuc(null);
    setEndResult(null);
    eventBus.emit('game:start');
  }, []);

  const handleRestart = useCallback(() => {
    document.body.dataset.state = 'playing';
    setGameState('playing');
    setXinKhuc(null);
    setEndResult(null);
    eventBus.emit('game:restart');
  }, []);

  const handleReturnTitle = useCallback(() => {
    setXinKhuc(null);
    setEndResult(null);
    eventBus.emit('game:returnTitle');
  }, []);

  const handleTogglePause = useCallback(() => {
    if (xinKhuc) return;
    if (gameState === 'playing') {
      eventBus.emit('game:setPaused', { paused: true });
    } else if (gameState === 'paused') {
      eventBus.emit('game:setPaused', { paused: false });
    }
  }, [gameState, xinKhuc]);

  const handleToggleMute = useCallback(() => {
    eventBus.emit('audio:toggleMute');
  }, []);

  const handleXinKhucSelect = useCallback((choice: 'sacrifice' | 'refuse', buffId?: BuffId) => {
    setXinKhuc(null);
    eventBus.emit('xinkhuc:select', { choice, buffId });
  }, []);

  // Global keyboard shortcuts (Enter/Space on Title, P/Esc Pause, M Mute, R Restart on Game Over)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStart();
        return;
      }

      if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if ((e.code === 'KeyP' || e.code === 'Escape') && !xinKhuc && (gameState === 'playing' || gameState === 'paused')) {
        e.preventDefault();
        handleTogglePause();
        return;
      }

      if (e.code === 'KeyR' && gameState === 'gameover') {
        e.preventDefault();
        handleRestart();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, xinKhuc, handleStart, handleRestart, handleTogglePause, handleToggleMute]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0e0a1a]">
      {/* Isolated Phaser Canvas Mount Container */}
      <div
        ref={mountRef}
        data-testid="phaser-canvas-container"
        className="w-full h-full flex items-center justify-center"
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          bestScore={bestScore}
          muted={muted}
          onStart={handleStart}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Active Gameplay HUD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHud
          hud={hud}
          muted={muted}
          onTogglePause={handleTogglePause}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Tactical Xin Khúc Modal */}
      {gameState === 'paused' && xinKhuc && (
        <XinKhucModal payload={xinKhuc} onSelect={handleXinKhucSelect} />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && !xinKhuc && (
        <PauseModal
          onResume={handleTogglePause}
          onRestart={handleRestart}
          onReturnTitle={handleReturnTitle}
        />
      )}

      {/* Victory / Game Over End Screen */}
      {gameState === 'gameover' && endResult && (
        <EndScreen
          result={endResult}
          onRestart={handleRestart}
          onReturnTitle={handleReturnTitle}
        />
      )}
    </div>
  );
}
