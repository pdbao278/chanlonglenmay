import React, { useState } from 'react';
import {
  BUFF_DEFINITIONS,
  LeaderboardEntry,
  loadLeaderboard,
  saveLeaderboardEntry,
} from '../core/game-rules';
import type { GameEndedPayload } from '../game/event-bus';

interface EndScreenProps {
  result: GameEndedPayload;
  onRestart: () => void;
  onReturnTitle: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({
  result,
  onRestart,
  onReturnTitle,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [saved, setSaved] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => loadLeaderboard());

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (saved) return;
    const updated = saveLeaderboardEntry(playerName || 'Chân Long', result.score, result.victory);
    setLeaderboard(updated);
    setSaved(true);
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-2.5 sm:p-4 bg-[#0b0716]/85 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-heading"
    >
      <div className="lacquer-panel animate-modal-pop rounded-2xl max-w-2xl w-full p-4 sm:p-6 md:p-7 text-[#fff8ea] max-h-[92vh] overflow-y-auto">
        {/* Top Outcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-5 border-b border-[#ffb703]/25">
          <div>
            <div
              className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1"
              style={{ color: result.victory ? '#06d6a0' : '#e63946' }}
            >
              {result.victory ? 'Chiến Thắng · Lên Mây Hóa Rồng' : 'Thất Bại · Đứt Đuôi Mất Dấu'}
            </div>
            <h2 id="end-heading" className="font-display text-xl sm:text-3xl font-extrabold text-[#fff8ea]">
              {result.victory ? 'Hạ Gục Thầy Thuốc!' : 'Đứt Sạch Khúc Đuôi'}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#f7e7c8]/80 mt-0.5 italic">“{result.bossQuote}”</p>
          </div>

          {/* Rank Crest */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 bg-[#1a1230] px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-[#ffb703]/40 self-start sm:self-auto">
            <div
              className="font-display text-3xl sm:text-4xl font-extrabold leading-none"
              style={{ color: result.rank.color }}
            >
              {result.rank.grade}
            </div>
            <div className="text-left">
              <div className="text-[10px] sm:text-[11px] text-[#f7e7c8]/70">Danh hiệu</div>
              <div className="text-[11px] sm:text-xs font-bold text-[#fff8ea]">{result.rank.title}</div>
            </div>
          </div>
        </div>

        {/* Core Mastery / Progress Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 my-3 sm:my-5">
          <div className="bg-[#18102b] rounded-xl p-2.5 sm:p-3 border border-[#ffb703]/25">
            <div className="text-[10px] sm:text-[11px] text-[#f7e7c8]/70">Tổng Điểm</div>
            <div className="font-mono-num text-lg sm:text-xl font-bold text-[#ffb703]">
              {result.score.toLocaleString('vi-VN')}
            </div>
          </div>
          <div className="bg-[#18102b] rounded-xl p-2.5 sm:p-3 border border-[#ffb703]/25">
            <div className="text-[10px] sm:text-[11px] text-[#f7e7c8]/70">Kỷ Lục</div>
            <div className="font-mono-num text-lg sm:text-xl font-bold text-[#06d6a0]">
              {result.bestScore.toLocaleString('vi-VN')}
            </div>
          </div>
          <div className="bg-[#18102b] rounded-xl p-2.5 sm:p-3 border border-[#ffb703]/25">
            <div className="text-[10px] sm:text-[11px] text-[#f7e7c8]/70">Quất / Lên Mây</div>
            <div className="font-mono-num text-lg sm:text-xl font-bold text-[#fff8ea]">
              {result.stats.whipHits} / {result.stats.feverTriggers}
            </div>
          </div>
          <div className="bg-[#18102b] rounded-xl p-2.5 sm:p-3 border border-[#ffb703]/25">
            <div className="text-[10px] sm:text-[11px] text-[#f7e7c8]/70">
              {result.victory ? 'Khúc Còn' : `Đợt ${result.stats.waveReached} · HP Boss`}
            </div>
            <div className="font-mono-num text-lg sm:text-xl font-bold text-[#c792ff]">
              {result.victory
                ? `${result.stats.segmentsRemaining}/${result.stats.maxSegments}`
                : result.stats.waveReached === 3
                  ? `${result.stats.bossHpRemaining}`
                  : `Đợt ${result.stats.waveReached}/3`}
            </div>
          </div>
        </div>

        {/* Applied Buffs summary */}
        {result.stats.buffs.length > 0 && (
          <div className="text-[11px] sm:text-xs text-[#f7e7c8]/80 mb-3 sm:mb-4">
            Bùa Buff đã nhận:{' '}
            {result.stats.buffs.map((id) => BUFF_DEFINITIONS[id].name).join(' · ')}
          </div>
        )}

        {/* Local Top 5 Leaderboard */}
        <div className="bg-[#150e26] rounded-xl p-3 sm:p-4 border border-[#ffb703]/20 mb-4 sm:mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#ffb703]">
              Bảng Vàng Hội Làng (Top 5)
            </span>
            {!saved ? (
              <form onSubmit={handleSaveScore} className="flex items-center gap-2">
                <label htmlFor="lb-name" className="sr-only">
                  Tên người chơi
                </label>
                <input
                  id="lb-name"
                  type="text"
                  maxLength={16}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Nhập tên..."
                  className="px-2.5 py-1.5 rounded-lg bg-[#22183b] border border-[#ffb703]/40 text-xs text-[#fff8ea] placeholder:text-[#f7e7c8]/45 focus:outline-none focus:border-[#06d6a0] w-32 sm:w-40"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[#06d6a0] hover:bg-[#19e6b0] text-[#0e0a1a] font-bold text-xs cursor-pointer whitespace-nowrap"
                >
                  Lưu Điểm
                </button>
              </form>
            ) : (
              <span className="text-xs font-semibold text-[#06d6a0]">Đã lưu vào Bảng Vàng</span>
            )}
          </div>

          {leaderboard.length === 0 ? (
            <p className="text-[11px] sm:text-xs text-[#f7e7c8]/55">Chưa có kỷ lục nào. Hãy là người đầu tiên ghi danh!</p>
          ) : (
            <div className="space-y-1 sm:space-y-1.5">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-[11px] sm:text-xs py-1 border-b border-[#ffffff]/5 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num text-[#ffb703] w-4">#{idx + 1}</span>
                    <span className="font-semibold text-[#fff8ea]">{entry.name}</span>
                    <span className="text-[#f7e7c8]/55 text-[10px] sm:text-xs">Hạng {entry.grade}</span>
                  </div>
                  <span className="font-mono-num font-bold text-[#06d6a0]">
                    {entry.score.toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-[#e63946] hover:bg-[#f04754] active:scale-[0.98] text-[#fff8ea] font-display font-extrabold text-sm sm:text-base border-2 border-[#ffb703] cursor-pointer whitespace-nowrap text-center"
          >
            Chơi Lại Ngay
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3.5 rounded-xl bg-[#241840] hover:bg-[#2f2052] active:scale-[0.98] text-[#fff8ea] font-semibold text-xs sm:text-sm border border-[#ffb703]/40 cursor-pointer whitespace-nowrap text-center"
          >
            Về Màn Hình Chính
          </button>
        </div>
      </div>
    </div>
  );
};
