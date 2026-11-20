import React from 'react';

interface TitleScreenProps {
  bestScore: number;
  muted: boolean;
  onStart: () => void;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  bestScore,
  muted,
  onStart,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between pointer-events-none select-none overflow-y-auto max-h-screen py-2 sm:py-4">
      {/* Measured contrast scrim preserving live courtyard periphery while keeping calm negative space in center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 68% 64% at 50% 48%, rgba(14, 9, 28, 0.84) 0%, rgba(14, 9, 28, 0.52) 60%, rgba(10, 6, 20, 0.72) 100%)',
        }}
      />

      {/* Top utility row */}
      <div className="relative z-10 flex items-center justify-between px-3 sm:px-6 pt-1 sm:pt-4">
        <div className="text-xs sm:text-sm text-[#f7e7c8]/80 font-mono-num truncate mr-2">
          {bestScore > 0 ? (
            <span>
              Kỷ lục: <strong className="text-[#ffb703]">{bestScore.toLocaleString('vi-VN')}</strong>
            </span>
          ) : (
            <span className="text-[#f7e7c8]/65">Đông Hồ Neon · Dân Gian Remix</span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          aria-pressed={muted}
          className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg lacquer-hud text-[11px] sm:text-xs font-semibold text-[#fff8ea] hover:border-[#ffb703] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill={muted ? 'none' : '#ffb703'} stroke="#fff8ea" />
            {muted ? (
              <path d="M23 9l-6 6M17 9l6 6" stroke="#e63946" strokeWidth="2.2" strokeLinecap="round" />
            ) : (
              <path d="M15.5 8.5a5 5 0 010 7M19 5a9.5 9.5 0 010 14" stroke="#06d6a0" strokeLinecap="round" />
            )}
          </svg>
          <span className="hidden xs:inline">{muted ? 'Đang tắt tiếng' : 'Nhạc Dân Gian'}</span>
        </button>
      </div>

      {/* Center hero lockup over calm negative space */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 text-center max-w-3xl mx-auto my-auto py-2 sm:py-4">
        {/* Bespoke inline SVG Đông Hồ Neon Title Emblem */}
        <svg
          viewBox="0 0 760 116"
          className="w-full max-w-[310px] sm:max-w-[480px] md:max-w-[660px] h-auto mb-2 sm:mb-3 drop-shadow-[0_8px_24px_rgba(0,0,0,0.75)]"
          role="img"
          aria-label="Chân Long Lên Mây"
        >
          {/* Traditional decorative cloud scroll corners */}
          <path
            d="M36 92 C18 92, 18 68, 38 68 C46 52, 72 52, 78 68 L112 68"
            fill="none"
            stroke="#06d6a0"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M724 92 C742 92, 742 68, 722 68 C714 52, 688 52, 682 68 L648 68"
            fill="none"
            stroke="#06d6a0"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Ornamental gold top arch */}
          <path
            d="M170 26 Q380 4 590 26"
            fill="none"
            stroke="#ffb703"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.85"
          />
          <circle cx="380" cy="15" r="5" fill="#e63946" stroke="#ffb703" strokeWidth="2" />

          {/* Main title with bold woodblock dark outline + warm gold fill */}
          <text
            x="380"
            y="88"
            textAnchor="middle"
            fontFamily="'Bricolage Grotesque', 'Be Vietnam Pro', sans-serif"
            fontWeight="800"
            fontSize="58"
            letterSpacing="1"
            fill="#ffb703"
            stroke="#160c28"
            strokeWidth="12"
            paintOrder="stroke fill"
          >
            CHÂN LONG LÊN MÂY
          </text>
        </svg>

        <p className="text-xs sm:text-base md:text-lg text-[#f7e7c8] max-w-xl mb-3 sm:mb-6 leading-relaxed">
          Né Thầy Thuốc · Bẻ Cua Quất Đuôi · Bay Lên Cõi Mây Neon
        </p>

        {/* Primary Start CTA */}
        <button
          type="button"
          data-start="true"
          onClick={(e) => {
            e.currentTarget.blur();
            onStart();
          }}
          className="pointer-events-auto px-8 sm:px-10 py-3 sm:py-4 rounded-xl bg-[#e63946] hover:bg-[#f04754] active:scale-[0.98] text-[#fff8ea] font-display text-lg sm:text-xl font-extrabold tracking-wide border-2 border-[#ffb703] shadow-[0_8px_28px_rgba(230,57,70,0.45)] transition-transform duration-150 cursor-pointer whitespace-nowrap shrink-0 mb-4 sm:mb-7"
        >
          Chơi Ngay
        </button>

        {/* Concise 3-line Quick How-to-Play Strip (GDD requirement) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 w-full max-w-2xl text-left border-t border-[#ffb703]/25 pt-3 sm:pt-5">
          <div className="px-1.5 sm:px-2">
            <div className="text-[11px] sm:text-xs font-bold text-[#ffb703] mb-0.5 sm:mb-1">01. Giữ Khúc Đuôi</div>
            <p className="text-[10px] sm:text-xs text-[#f7e7c8]/85 leading-snug">
              Dẫn đoàn né Thầy Thuốc quanh cây đa. Đứt hết khúc đuôi sẽ thua.
            </p>
          </div>
          <div className="px-1.5 sm:px-2 sm:border-l sm:border-[#ffb703]/20 sm:pl-3">
            <div className="text-[11px] sm:text-xs font-bold text-[#06d6a0] mb-0.5 sm:mb-1">02. Bẻ Cua Quất Đuôi</div>
            <p className="text-[10px] sm:text-xs text-[#f7e7c8]/85 leading-snug">
              Bấm Dash và cua gấp để quất đuôi choáng Boss, thu thập Hạt Mây.
            </p>
          </div>
          <div className="px-1.5 sm:px-2 sm:border-l sm:border-[#ffb703]/20 sm:pl-3">
            <div className="text-[11px] sm:text-xs font-bold text-[#c792ff] mb-0.5 sm:mb-1">03. 100% Mây Lên Mây</div>
            <p className="text-[10px] sm:text-xs text-[#f7e7c8]/85 leading-snug">
              Hóa Rồng Ánh Sáng bất tử 8 giây, húc cạn 1.000 HP Boss ở Đợt 3.
            </p>
          </div>
        </div>
      </main>

      {/* Responsive control-hint footer */}
      <footer className="relative z-10 text-center pb-2 sm:pb-4 px-3 text-[10px] sm:text-xs text-[#f7e7c8]/75">
        <span className="block sm:inline">📱 Vuốt chạm dẫn đường · Bấm nút DASH để quất đuôi</span>
        <span className="hidden sm:inline"> · 💻 Chuột/WASD Di chuyển · Space Dash · P Tạm dừng</span>
      </footer>
    </div>
  );
};
