import React, { useEffect, useState } from 'react';
import { BUFF_DEFINITIONS } from '../core/game-rules';
import type { HudSnapshot } from '../game/event-bus';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  muted,
  onTogglePause,
  onToggleMute,
}) => {
  // Trailing damage ghost bar for Boss HP
  const [ghostBossHp, setGhostBossHp] = useState(hud.bossHp);

  useEffect(() => {
    if (hud.bossHp >= ghostBossHp) {
      setGhostBossHp(hud.bossHp);
      return;
    }
    const timer = window.setTimeout(() => {
      setGhostBossHp(hud.bossHp);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [hud.bossHp, ghostBossHp]);

  const bossHpPct = Math.max(0, Math.min(100, (hud.bossHp / hud.bossMaxHp) * 100));
  const ghostBossPct = Math.max(bossHpPct, Math.min(100, (ghostBossHp / hud.bossMaxHp) * 100));

  return (
    <div
      className={`fixed inset-0 z-10 pointer-events-none select-none flex flex-col justify-between p-4 ${
        hud.isFever ? 'fever-vignette' : ''
      }`}
    >
      {/* Top Perimeter HUD Clusters (keeps >= 88% playfield unobstructed) */}
      <div className="flex items-start justify-between gap-4">
        {/* TOP-LEFT: Khúc Đuôi Vitality Lanterns + Thanh Mây + Dash */}
        <div className={`rounded-xl px-3.5 py-2.5 min-w-[268px] ${hud.isFever ? 'lacquer-hud-fever' : 'lacquer-hud'}`}>
          {/* Vitality lantern sockets */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#f7e7c8]/80">
              Khúc Đuôi
            </span>
            <span className="font-mono-num text-sm font-bold text-[#ffb703]">
              {hud.segmentsCount}/{hud.maxSegments}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2.5" aria-label={`Còn ${hud.segmentsCount} trên ${hud.maxSegments} khúc đuôi`}>
            {Array.from({ length: hud.maxSegments }).map((_, idx) => {
              const filled = idx < hud.segmentsCount;
              const isTip = idx === hud.segmentsCount - 1 && filled;
              return (
                <svg
                  key={idx}
                  viewBox="0 0 28 28"
                  className="w-7 h-7 transition-transform duration-150"
                  aria-hidden="true"
                >
                  {/* Dark outer silhouette */}
                  <circle cx="14" cy="14" r="12" fill="#120b20" stroke={filled ? (isTip ? '#06d6a0' : '#ffb703') : '#4a3d66'} strokeWidth="2" />
                  {filled ? (
                    <>
                      <circle cx="14" cy="14" r="8.5" fill={hud.isFever || isTip ? '#06d6a0' : '#e63946'} />
                      <ellipse cx="14" cy="14" rx="4.2" ry="8.2" fill="none" stroke="#ffe082" strokeWidth="1.4" />
                      <circle cx="14" cy="12" r="2.2" fill="#fff9db" />
                    </>
                  ) : (
                    /* Hollow cracked empty socket */
                    <path d="M9 9l10 10M19 9l-10 10" stroke="#574775" strokeWidth="1.8" strokeLinecap="round" />
                  )}
                </svg>
              );
            })}

            {/* Dash readiness compact badge */}
            <div className="ml-auto flex items-center gap-1.5 pl-2 border-l border-[#ffb703]/25">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hud.dashCooldownRatio >= 1 ? '#06d6a0' : '#6b5c8a' }} />
              <span className="text-[11px] font-semibold text-[#f7e7c8]/90 whitespace-nowrap">
                {hud.dashCooldownRatio >= 1 ? 'Dash' : 'Hồi'}
              </span>
            </div>
          </div>

          {/* Thanh Mây (0–100%) Fever Meter */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className={hud.isFever ? 'font-bold text-[#06d6a0]' : 'font-semibold text-[#c792ff]'}>
                {hud.isFever ? `LÊN MÂY · ${hud.feverTimeLeft.toFixed(1)}s` : 'Thanh Mây'}
              </span>
              <span className="font-mono-num font-bold text-[#fff8ea]">{hud.cloudPercent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#1f1636] overflow-hidden border border-[#ffb703]/25">
              <div
                className="h-full rounded-full transition-[width] duration-100"
                style={{
                  width: `${hud.cloudPercent}%`,
                  backgroundColor: hud.isFever ? '#06d6a0' : hud.cloudPercent >= 80 ? '#ffb703' : '#9b5de5',
                }}
              />
            </div>
          </div>

          {/* Quất Đuôi (10s CD) & Hồi Khúc (10s Spawn) compact status row */}
          <div className="mt-2 pt-2 border-t border-[#ffb703]/20 grid grid-cols-2 gap-3 text-[11px]">
            <div className="flex flex-col gap-1" data-testid="hud-whip-status">
              <div className="flex items-center justify-between gap-1.5 whitespace-nowrap">
                <span className="text-[#f7e7c8]/75 font-semibold">Quất Đuôi</span>
                <span
                  className={`font-mono-num font-bold ${
                    hud.whipActive
                      ? 'text-[#ffe66d]'
                      : hud.whipCooldownLeft <= 0
                        ? 'text-[#06d6a0]'
                        : 'text-[#f7e7c8]/65'
                  }`}
                >
                  {hud.whipActive ? 'QUẤT!' : hud.whipCooldownLeft <= 0 ? 'Sẵn sàng' : `${hud.whipCooldownLeft}s`}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#1f1636] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-150"
                  style={{
                    width: `${
                      hud.whipActive
                        ? 100
                        : Math.max(
                            0,
                            Math.min(100, ((hud.whipCooldownMax - hud.whipCooldownLeft) / Math.max(1, hud.whipCooldownMax)) * 100)
                          )
                    }%`,
                    backgroundColor: hud.whipActive ? '#ffe66d' : hud.whipCooldownLeft <= 0 ? '#06d6a0' : '#ffb703',
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 pl-2.5 border-l border-[#ffb703]/20" data-testid="hud-heal-status">
              <div className="flex items-center justify-between gap-1.5 whitespace-nowrap">
                <span className="text-[#f7e7c8]/75 font-semibold">Hồi Khúc</span>
                <span
                  className={`font-mono-num font-bold ${
                    hud.healItemActiveCount > 0 ? 'text-[#ff85a1]' : 'text-[#ffb703]'
                  }`}
                >
                  {hud.healItemActiveCount > 0 ? `Có (${hud.healItemActiveCount})` : `${hud.healItemNextSec}s`}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#1f1636] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-150"
                  style={{
                    width: `${
                      hud.healItemActiveCount > 0
                        ? 100
                        : Math.max(0, Math.min(100, ((10 - hud.healItemNextSec) / 10) * 100))
                    }%`,
                    backgroundColor: hud.healItemActiveCount > 0 ? '#ff4d6d' : '#ff85a1',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Active Xin Khúc buffs */}
          {hud.appliedBuffs.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-[#ffb703]/20 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-[#f7e7c8]/85">
              {hud.appliedBuffs.map((bId) => (
                <span key={bId} style={{ color: BUFF_DEFINITIONS[bId].accentColor }} className="font-semibold">
                  {BUFF_DEFINITIONS[bId].name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* TOP-CENTER: Wave Timer OR Boss HP Bar (Wave 3) */}
        <div className="flex flex-col items-center gap-2 max-w-md w-full">
          {hud.wave === 3 ? (
            <div className="w-full lacquer-hud rounded-xl px-4 py-2.5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-display font-bold text-[#ffb703] tracking-wide">
                  TRÙM THẦY THUỐC {hud.bossStunned ? '· CHOÁNG!' : ''}
                </span>
                <span className="font-mono-num font-bold text-[#fff8ea]">
                  {hud.bossHp} / {hud.bossMaxHp} HP
                </span>
              </div>
              <div className="relative h-3.5 w-full rounded-full bg-[#241338] overflow-hidden border border-[#e63946]/60">
                {/* Delayed trailing damage ghost bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-[#ffb703] transition-[width] duration-300"
                  style={{ width: `${ghostBossPct}%` }}
                />
                {/* Live Boss HP bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-[#e63946] transition-[width] duration-100"
                  style={{ width: `${bossHpPct}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="lacquer-hud rounded-xl px-5 py-2 flex items-center gap-4">
              <div className="text-left">
                <div className="text-[11px] uppercase tracking-wider text-[#f7e7c8]/75 font-semibold">
                  {hud.waveTitle}
                </div>
              </div>
              <div className="pl-3 border-l border-[#ffb703]/30 font-mono-num text-xl font-bold text-[#ffb703]">
                {hud.waveTimeLeft}s
              </div>
            </div>
          )}

          {/* Transient Wave / Fever Callout Banner */}
          {hud.bannerText && (
            <div className="px-4 py-1.5 rounded-lg bg-[#120b20]/90 border border-[#ffb703]/70 text-xs md:text-sm font-display font-bold text-[#ffe66d] tracking-wide text-center shadow-lg">
              {hud.bannerText}
            </div>
          )}
        </div>

        {/* TOP-RIGHT: Score Readout + Utility Buttons */}
        <div className="flex items-start gap-2.5">
          <div className="lacquer-hud rounded-xl px-4 py-2 text-right min-w-[138px]">
            <div className="flex items-center justify-end gap-2">
              {hud.multiplier > 1 && (
                <span className="text-xs font-mono-num font-bold text-[#e63946]">
                  x{hud.multiplier}
                </span>
              )}
              <span className="text-[11px] uppercase tracking-wider text-[#f7e7c8]/75 font-semibold">
                Điểm
              </span>
            </div>
            <div
              data-testid="hud-score"
              className="font-mono-num text-2xl font-bold leading-tight text-[#fff8ea] hud-text-stroke-sm"
            >
              {hud.score.toLocaleString('vi-VN')}
            </div>
          </div>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            aria-pressed={muted}
            title="Âm thanh (M)"
            className="pointer-events-auto w-11 h-11 rounded-xl lacquer-hud flex items-center justify-center text-[#fff8ea] hover:border-[#ffb703] transition-colors cursor-pointer shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" fill={muted ? 'none' : '#ffb703'} />
              {muted ? (
                <path d="M22 9l-6 6M16 9l6 6" stroke="#e63946" strokeLinecap="round" />
              ) : (
                <path d="M15.5 8.5a5 5 0 010 7" stroke="#06d6a0" strokeLinecap="round" />
              )}
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTogglePause();
            }}
            aria-label="Tạm dừng trò chơi"
            title="Tạm dừng (P / Esc)"
            className="pointer-events-auto w-11 h-11 rounded-xl lacquer-hud flex items-center justify-center text-[#fff8ea] hover:border-[#ffb703] transition-colors cursor-pointer shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom subtle status line */}
      <div className="flex items-center justify-center">
        <div className="text-[11px] text-[#fff8ea]/70 hud-text-stroke-sm">
          {hud.isFever
            ? 'LÊN MÂY! Lao thẳng vào Thầy Thuốc để gây sát thương!'
            : 'Click Trái / Space để Dash & bẻ cua gắt Quất Đuôi'}
        </div>
      </div>
    </div>
  );
};
