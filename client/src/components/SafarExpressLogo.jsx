import React from 'react';

export default function SafarExpressLogo({ light = false }) {
  return (
    <div className="flex items-center gap-3 cursor-pointer group transition-transform origin-left sm:scale-100 scale-90">
      <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_15px_rgba(59,130,246,0.5)] border-2 border-white z-10 shrink-0">
        <span className="text-2xl font-black text-white tracking-tighter drop-shadow-md z-10">
          SE
        </span>

        {/* Orbiting side-view cab */}
        <div className="absolute inset-0 rounded-full animate-[spin_4s_linear_infinite] pointer-events-none z-20">
          <div className="absolute -top-[23px] left-1/2 -translate-x-1/2 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              {/* Roof sign */}
              <rect x="10" y="3" width="4" height="2" rx="0.5" fill="currentColor" />
              <path d="M23 11 h-4.5 L15 6 H8 L4.5 11 H2 v5 h3 a3 3 0 0 1 6 0 h6 a3 3 0 0 1 6 0 v-5 z" fill="currentColor" />
              {/* Windows */}
              <path d="M12 11V7h2.8l1.6 4H12z" fill="#0f172a" />
              <path d="M7 11l1.2-4H11v4H7z" fill="#0f172a" />
              {/* Wheels */}
              <circle cx="8" cy="16" r="2.5" fill="#0f172a" />
              <circle cx="20" cy="16" r="2.5" fill="#0f172a" />
              <circle cx="8" cy="16" r="1" fill="#cbd5e1" />
              <circle cx="20" cy="16" r="1" fill="#cbd5e1" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center z-10">
        <span className={`text-2xl font-extrabold tracking-tight leading-none transition-colors duration-300 ${light
          ? 'text-white drop-shadow-md'
          : 'text-blue-950 group-hover:text-blue-600'
          }`}>
          SAFAREXPRESS
        </span>
      </div>
    </div>
  );
}
