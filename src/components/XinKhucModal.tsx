import React, { useEffect } from 'react';
import type { BuffId } from '../core/game-rules';
import type { XinKhucPayload } from '../game/event-bus';

interface XinKhucModalProps {
  payload: XinKhucPayload;
  onSelect: (choice: 'sacrifice' | 'refuse', buffId?: BuffId) => void;
}

export const XinKhucModal: React.FC<XinKhucModalProps> = ({ payload, onSelect }) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && payload.canSacrifice && payload.buffChoices[0]) {
        e.preventDefault();
        onSelect('sacrifice', payload.buffChoices[0].id);
      } else if (e.key === '2') {
        e.preventDefault();
        onSelect('refuse');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [payload, onSelect]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-2.5 sm:p-4 bg-[#0b0716]/85 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="xinkhuc-heading"
    >
      <div className="lacquer-panel animate-modal-pop rounded-2xl max-w-2xl w-full p-4 sm:p-6 md:p-7 text-[#fff8ea] max-h-[92vh] overflow-y-auto">
        {/* Header with Boss Portrait & Dialogue */}
        <div className="flex items-center gap-3 sm:gap-4 pb-3 sm:pb-5 border-b border-[#ffb703]/25">
          <img
            src="/assets/aistudio/boss_thay_thuoc_idle_fea08f45.png"
            alt="Thầy Thuốc"
            referrerPolicy="no-referrer"
            className="w-14 h-14 sm:w-20 sm:h-20 object-contain shrink-0 drop-shadow-[0_4px_14px_rgba(155,93,229,0.55)]"
          />
          <div>
            <div className="text-[10px] sm:text-xs font-semibold text-[#ffb703] mb-0.5 sm:mb-1">
              Hoàn thành Đợt {payload.waveCompleted} · Sự Kiện Xin Khúc
            </div>
            <h2 id="xinkhuc-heading" className="font-display text-lg sm:text-2xl font-extrabold text-[#fff8ea]">
              “Thầy thuốc xin 1 khúc!”
            </h2>
            <p className="text-xs sm:text-sm text-[#f7e7c8]/80 mt-0.5 sm:mt-1">
              Hiện còn <strong className="font-mono-num text-[#06d6a0]">{payload.segmentsCount} khúc đuôi</strong>. Đánh đổi lấy Bùa Buff vĩnh viễn hay khịa Thầy Thuốc để nhân đôi điểm?
            </p>
          </div>
        </div>

        {/* Option 1: Sacrifice 1 Segment for a Permanent Buff */}
        <div className="mt-3 sm:mt-5">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#06d6a0]">
              Lựa Chọn 1: Cho 1 Khúc lấy Bùa Buff
            </span>
            {!payload.canSacrifice && (
              <span className="text-[10px] sm:text-xs font-semibold text-[#e63946]">
                Cần tối thiểu 2 khúc đuôi để cho
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {payload.buffChoices.map((buff) => (
              <button
                key={buff.id}
                type="button"
                disabled={!payload.canSacrifice}
                onClick={() => onSelect('sacrifice', buff.id)}
                className={`text-left p-2.5 sm:p-3.5 rounded-xl border transition-transform duration-150 ${
                  payload.canSacrifice
                    ? 'bg-[#1a1230] border-[#ffb703]/45 hover:border-[#06d6a0] active:scale-[0.98] cursor-pointer'
                    : 'bg-[#151024] border-[#423659]/50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="font-display font-bold text-xs sm:text-sm mb-0.5" style={{ color: buff.accentColor }}>
                  {buff.name}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-[#fff8ea] mb-1">{buff.shortDesc}</div>
                <p className="text-[10px] sm:text-[11px] text-[#f7e7c8]/75 leading-relaxed">{buff.detail}</p>
                <div className="mt-1.5 sm:mt-2.5 text-[10px] sm:text-[11px] font-mono-num text-[#ffb703]">
                  -1 Khúc ({payload.segmentsCount} → {Math.max(0, payload.segmentsCount - 1)})
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Option 2: Refuse (Khịa Thầy Thuốc) */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-[#ffb703]/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div>
            <div className="font-display font-bold text-sm sm:text-base text-[#e63946]">
              Lựa Chọn 2: Không Cho (Khịa Thầy Thuốc)
            </div>
            <p className="text-[11px] sm:text-xs text-[#f7e7c8]/80 mt-0.5">
              Giữ nguyên {payload.segmentsCount} khúc · Boss tăng tốc (+15%) · <strong className="text-[#ffb703]">x2 Điểm Thưởng</strong> Đợt sau.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelect('refuse')}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl bg-[#e63946] hover:bg-[#f04754] active:scale-[0.98] text-[#fff8ea] font-display font-bold text-xs sm:text-sm border border-[#ffb703] cursor-pointer whitespace-nowrap shrink-0 text-center"
          >
            Không Cho (x2 Điểm)
          </button>
        </div>
      </div>
    </div>
  );
};
