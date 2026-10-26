import React from 'react';
import { KeyAssets, KeyCap } from './GameIcon';

const W = '#ffffff';

const Mouse = ({ part }: { part: 'left' | 'right' | 'wheel' | 'wheelPress' }) => (
  <svg viewBox="0 0 24 28" className="h-[26px] w-[22px] flex-shrink-0" fill="none" stroke={W} strokeWidth="1.6">
    {part === 'left' && <path d="M5 11V9a7 7 0 0 1 7-7v9z" fill={W} stroke="none" />}
    {part === 'right' && <path d="M19 11V9a7 7 0 0 0-7-7v9z" fill={W} stroke="none" />}
    <rect x="5" y="2" width="14" height="24" rx="7" />
    <path d="M5 11h14M12 2v9" />
    {(part === 'wheel' || part === 'wheelPress') && (
      <rect x="10.2" y="4.5" width="3.6" height={part === 'wheelPress' ? 7 : 5.5} rx="1.8" fill={W} stroke="none" />
    )}
  </svg>
);

const DPad = () => (
  <svg viewBox="0 0 24 24" className="h-[24px] w-[24px] flex-shrink-0">
    <rect x="1" y="1" width="22" height="22" rx="5" fill={W} />
    <circle cx="12" cy="12" r="3.2" fill="#14161b" />
    <path d="M12 3.6l2.2 2.6H9.8zM12 20.4l-2.2-2.6h4.4zM3.6 12l2.6-2.2v4.4zM20.4 12l-2.6 2.2V9.8z" fill="#14161b" />
  </svg>
);

const EnterKey = () => (
  <svg viewBox="0 0 24 24" className="h-[24px] w-[24px] flex-shrink-0" fill="none">
    <rect x="1" y="1" width="22" height="22" rx="4" fill={W} />
    <path d="M17 7v6H8M11 10l-3 3 3 3" stroke="#14161b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type Hint = { icon: React.ReactNode; label: string };

export default function Keybinds({ checkoutLabel }: { checkoutLabel: string }) {
  const rows: Hint[][] = [
    [
      { icon: <Mouse part="left" />, label: 'MOVE CAMERA' },
      { icon: <Mouse part="right" />, label: 'ROTATE' },
      { icon: <Mouse part="wheel" />, label: 'ZOOM' },
      { icon: <Mouse part="wheelPress" />, label: 'FOCUS' },
    ],
    [
      { icon: <DPad />, label: 'MOVE' },
      { icon: <EnterKey />, label: 'SELECT' },
      { icon: <KeyCap src={KeyAssets.esc} alt="ESC" className="h-[26px] w-auto" />, label: 'EXIT' },
      { icon: <KeyCap src={KeyAssets.tab} alt="TAB" className="h-[26px] w-auto" />, label: checkoutLabel },
    ],
  ];

  return (
    <div className="flex flex-col gap-3 bg-[#14161b]/85 px-5 py-3">
      {rows.map((row, r) => (
        <div key={r} className="flex items-center justify-between">
          {row.map((hint, i) => (
            <React.Fragment key={hint.label}>
              {i > 0 && <span className="font-barlow text-[20px] text-white/35 leading-none select-none">/</span>}
              <div className="flex items-center gap-2.5">
                {hint.icon}
                <span className="font-oswald font-bold italic text-[17px] text-white uppercase leading-none whitespace-nowrap">
                  {hint.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
