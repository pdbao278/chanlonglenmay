import React, { useEffect, useState } from 'react';
import { BUFF_DEFINITIONS } from '../core/game-rules';
import { eventBus, type HudSnapshot } from '../game/event-bus';

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

  const handleMobileDash = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    eventBus.emit('game:dash');
  };

  return (
    <div
      className={`fixed inset-0 z-10 pointer-events-none select-none flex flex-col justify-between p-2 sm:p-4 ${
        hud.isFever ? 'fever-vignette' : ''
      }`}
    >
      {/* Top Perimeter HUD Clusters - Fully responsive on small mobile screens */}
      <div className="flex items-start justify-between gap-1.5 sm:gap-4">
        {/* TOP-LEFT: Khúc Đuôi Vitality Lanterns + Thanh Mây + Dash */}
        <div
          className={`rounded-lg sm:rounded-xl p-2 sm:px-3.5 sm:py-2.5 min-w-0 max-w-[44%] sm:max-w-none sm:min-w-[260px] ${
            hud.isFever ? 'lacquer-hud-fever' : 'lacquer-hud'
          }`}
        >
          {/* Vitality lantern sockets */}
          <div className="flex items-center justify-between gap-1 sm:gap-3 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#f7e7c8]/80 truncate">
              Khúc Đuôi
            </span>
            <span className="font-mono-num text-xs sm:text-sm font-bold text-[#ffb703]">
              {hud.segmentsCount}/{hud.maxSegments}
            </span>
          </div>

          <div
            className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2.5"
            aria-label={`Còn ${hud.segmentsCount} trên ${hud.maxSegments} khúc đuôi`}
          >
            <div className="flex items-center gap-1 shrink-0">
              {Array.from({ length: hud.maxSegments }).map((_, idx) => {
                const filled = idx < hud.segmentsCount;
                const isTip = idx === hud.segmentsCount - 1 && filled;
                return (
                  <svg
                    key={idx}
                    viewBox="0 0 28 28"
                    className="w-5 h-5 sm:w-7 sm:h-7 transition-transform duration-150"
                    aria-hidden="true"
                  >
                    <circle
                      cx="14"
                      cy="14"
                      r="12"
                      fill="#120b20"
                      stroke={filled ? (isTip ? '#06d6a0' : '#ffb703') : '#4a3d66'}
                      strokeWidth="2"
                    />
                    {filled ? (
                      <>
                        <circle
                          cx="14"
                          cy="14"
                          r="8.5"
                          fill={hud.isFever || isTip ? '#06d6a0' : '#e63946'}
                        />
                        <ellipse
                          cx="14"
                          cy="14"
                          rx="4.2"
                          ry="8.2"
                          fill="none"
                          stroke="#ffe082"
                          strokeWidth="1.4"
                        />
                        <circle cx="14" cy="12" r="2.2" fill="#fff9db" />
                      </>
                    ) : (
                      <path
                        d="M9 9l10 10M19 9l-10 10"
                        stroke="#574775"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                );
              })}
            </div>

            {/* Dash readiness compact badge */}
            <div className="ml-auto flex items-center gap-1 pl-1.5 sm:pl-2 border-l border-[#ffb703]/25">
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                style={{
                  backgroundColor: hud.dashCooldownRatio >= 1 ? '#06d6a0' : '#6b5c8a',
                }}
              />
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#f7e7c8]/90 whitespace-nowrap hidden xs:inline">
                {hud.dashCooldownRatio >= 1 ? 'Dash' : 'Hồi'}
              </span>
            </div>
          </div>

          {/* Thanh Mây (0–100%) Fever Meter */}
          <div>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-0.5 sm:mb-1">
              <span
                className={`truncate ${
                  hud.isFever
                    ? 'font-bold text-[#06d6a0]'
                    : 'font-semibold text-[#c792ff]'
                }`}
              >
                {hud.isFever ? `LÊN MÂY ${hud.feverTimeLeft.toFixed(1)}s` : 'Thanh Mây'}
              </span>
              <span className="font-mono-num font-bold text-[#fff8ea] ml-1">
                {hud.cloudPercent}%
              </span>
            </div>
            <div className="h-2 sm:h-2.5 w-full rounded-full bg-[#1f1636] overflow-hidden border border-[#ffb703]/25">
              <div
                className="h-full rounded-full transition-[width] duration-100"
                style={{
                  width: `${hud.cloudPercent}%`,
                  backgroundColor: hud.isFever
                    ? '#06d6a0'
                    : hud.cloudPercent >= 80
                      ? '#ffb703'
                      : '#9b5de5',
                }}
              />
            </div>
          </div>

          {/* Quất Đuôi & Hồi Khúc status row - hidden on ultra-small height to keep screen clean */}
          <div className="mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 border-t border-[#ffb703]/20 grid grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
            <div className="flex flex-col gap-0.5 sm:gap-1" data-testid="hud-whip-status">
              <div className="flex items-center justify-between gap-1 whitespace-nowrap">
                <span className="text-[#f7e7c8]/75 font-semibold truncate">Quất</span>
                <span
                  className={`font-mono-num font-bold ${
                    hud.whipActive
                      ? 'text-[#ffe66d]'
                      : hud.whipCooldownLeft <= 0
                        ? 'text-[#06d6a0]'
                        : 'text-[#f7e7c8]/65'
                  }`}
                >
                  {hud.whipActive
                    ? 'QUẤT!'
                    : hud.whipCooldownLeft <= 0
                      ? 'Sẵn sàng'
                      : `${hud.whipCooldownLeft}s`}
                </span>
              </div>
              <div className="h-1 sm:h-1.5 w-full rounded-full bg-[#1f1636] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-150"
                  style={{
                    width: `${
                      hud.whipActive
                        ? 100
                        : Math.max(
                            0,
                            Math.min(
                              100,
                              ((hud.whipCooldownMax - hud.whipCooldownLeft) /
                                Math.max(1, hud.whipCooldownMax)) *
                                100
                            )
                          )
                    }%`,
                    backgroundColor: hud.whipActive
                      ? '#ffe66d'
                      : hud.whipCooldownLeft <= 0
                        ? '#06d6a0'
                        : '#ffb703',
                  }}
                />
              </div>
            </div>

            <div
              className="flex flex-col gap-0.5 sm:gap-1 pl-1.5 sm:pl-2.5 border-l border-[#ffb703]/20"
              data-testid="hud-heal-status"
            >
              <div className="flex items-center justify-between gap-1 whitespace-nowrap">
                <span className="text-[#f7e7c8]/75 font-semibold truncate">Hồi Khúc</span>
                <span
                  className={`font-mono-num font-bold ${
                    hud.healItemActiveCount > 0 ? 'text-[#ff85a1]' : 'text-[#ffb703]'
                  }`}
                >
                  {hud.healItemActiveCount > 0
                    ? `(${hud.healItemActiveCount})`
                    : `${hud.healItemNextSec}s`}
                </span>
              </div>
              <div className="h-1 sm:h-1.5 w-full rounded-full bg-[#1f1636] overflow-hidden">
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
            <div className="mt-1 sm:mt-2 pt-1 border-t border-[#ffb703]/20 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] sm:text-[11px] text-[#f7e7c8]/85">
              {hud.appliedBuffs.map((bId) => (
                <span
                  key={bId}
                  style={{ color: BUFF_DEFINITIONS[bId].accentColor }}
                  className="font-semibold"
                >
                  {BUFF_DEFINITIONS[bId].name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* TOP-CENTER: Wave Timer OR Boss HP Bar (Wave 3) */}
        <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1 max-w-[130px] sm:max-w-md mx-1">
          {hud.wave === 3 ? (
            <div className="w-full lacquer-hud rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2.5">
              <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                <span className="font-display font-bold text-[#ffb703] tracking-wide truncate">
                  TRÙM {hud.bossStunned ? 'CHOÁNG!' : ''}
                </span>
                <span className="font-mono-num font-bold text-[#fff8ea]">
                  {hud.bossHp}/{hud.bossMaxHp}
                </span>
              </div>
              <div className="relative h-2.5 sm:h-3.5 w-full rounded-full bg-[#241338] overflow-hidden border border-[#e63946]/60">
                <div
                  className="absolute inset-y-0 left-0 bg-[#ffb703] transition-[width] duration-300"
                  style={{ width: `${ghostBossPct}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-[#e63946] transition-[width] duration-100"
                  style={{ width: `${bossHpPct}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="lacquer-hud rounded-lg sm:rounded-xl px-2.5 py-1 sm:px-5 sm:py-2 flex items-center gap-2 sm:gap-4">
              <div className="text-left">
                <div className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#f7e7c8]/75 font-semibold truncate">
                  {hud.waveTitle}
                </div>
              </div>
              <div className="pl-1.5 sm:pl-3 border-l border-[#ffb703]/30 font-mono-num text-sm sm:text-xl font-bold text-[#ffb703]">
                {hud.waveTimeLeft}s
              </div>
            </div>
          )}

          {/* Transient Wave / Fever Callout Banner */}
          {hud.bannerText && (
            <div className="px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-lg bg-[#120b20]/95 border border-[#ffb703]/70 text-[10px] sm:text-xs md:text-sm font-display font-bold text-[#ffe66d] tracking-wide text-center shadow-lg truncate max-w-full">
              {hud.bannerText}
            </div>
          )}
        </div>

        {/* TOP-RIGHT: Score Readout + Utility Buttons */}
        <div className="flex items-start gap-1 sm:gap-2.5 shrink-0">
          <div className="lacquer-hud rounded-lg sm:rounded-xl px-2 py-1 sm:px-4 sm:py-2 text-right min-w-[70px] sm:min-w-[138px]">
            <div className="flex items-center justify-end gap-1 sm:gap-2">
              {hud.multiplier > 1 && (
                <span className="text-[10px] sm:text-xs font-mono-num font-bold text-[#e63946]">
                  x{hud.multiplier}
                </span>
              )}
              <span className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#f7e7c8]/75 font-semibold">
                Điểm
              </span>
            </div>
            <div
              data-testid="hud-score"
              className="font-mono-num text-sm sm:text-2xl font-bold leading-tight text-[#fff8ea] hud-text-stroke-sm"
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
            className="pointer-events-auto w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl lacquer-hud flex items-center justify-center text-[#fff8ea] hover:border-[#ffb703] transition-colors cursor-pointer shrink-0"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
            className="pointer-events-auto w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl lacquer-hud flex items-center justify-center text-[#fff8ea] hover:border-[#ffb703] transition-colors cursor-pointer shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Virtual Mobile Action Button (DASH / QUẤT ĐUÔI) - Optimized for touch thumbs */}
      <div className="relative w-full flex items-end justify-between pointer-events-none">
        {/* Bottom subtle status line */}
        <div className="flex-1 flex items-center justify-center px-4 mb-1">
          <div className="text-[10px] sm:text-[11px] text-[#fff8ea]/75 hud-text-stroke-sm text-center">
            {hud.isFever
              ? 'LÊN MÂY! Húc thẳng vào Thầy Thuốc gây sát thương lớn!'
              : 'Chạm & kéo dẫn đường · Bấm DASH hoặc chạm để bẻ cua quất đuôi'}
          </div>
        </div>

        {/* Dedicated Virtual Dash Button on mobile screen */}
        <button
          type="button"
          tabIndex={-1}
          onPointerDown={handleMobileDash}
          className={`pointer-events-auto absolute right-2 bottom-1 sm:right-5 sm:bottom-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center cursor-pointer select-none transition-transform active:scale-90 ${
            hud.isFever ? 'virtual-dash-btn-fever' : 'virtual-dash-btn'
          }`}
          aria-label="Dash và quất đuôi"
          title="Dash / Quất Đuôi (Phím Space / Click chuột)"
        >
          {/* Inner Cooldown Radial or Fill Shade */}
          {hud.dashCooldownRatio < 1 && !hud.isFever && (
            <div
              className="absolute inset-0 rounded-full bg-black/60 transition-[height] duration-75 overflow-hidden"
              style={{ height: `${(1 - hud.dashCooldownRatio) * 100}%` }}
            />
          )}

          <span className="font-display font-extrabold text-xs sm:text-sm text-[#fff8ea] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide leading-none">
            {hud.isFever ? 'LÊN MÂY' : hud.whipActive ? 'QUẤT' : 'DASH'}
          </span>
          <span className="text-[8px] sm:text-[9px] font-semibold text-[#ffe082] uppercase mt-0.5 tracking-tighter">
            {hud.dashCooldownRatio >= 1 ? 'Sẵn Sàng' : 'Hồi...'}
          </span>
        </button>
      </div>
    </div>
  );
};
