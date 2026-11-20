import React from 'react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onReturnTitle,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#0b0716]/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-heading"
    >
      <div className="lacquer-panel animate-modal-pop rounded-2xl max-w-sm w-full p-6 text-center text-[#fff8ea]">
        <h2 id="pause-heading" className="font-display text-2xl font-extrabold text-[#ffb703] mb-1.5">
          Tạm Dừng
        </h2>
        <p className="text-xs text-[#f7e7c8]/75 mb-6">
          Nhấn P hoặc Esc để tiếp tục hội làng
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-[#06d6a0] hover:bg-[#19e6b0] text-[#0e0a1a] font-display font-extrabold text-base cursor-pointer whitespace-nowrap"
          >
            Tiếp Tục
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-[#241840] hover:bg-[#2f2052] text-[#fff8ea] font-semibold text-sm border border-[#ffb703]/45 cursor-pointer whitespace-nowrap"
          >
            Chơi Lại Từ Đầu
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-[#ffffff]/10 text-[#f7e7c8]/85 text-sm cursor-pointer whitespace-nowrap"
          >
            Về Màn Hình Chính
          </button>
        </div>
      </div>
    </div>
  );
};
