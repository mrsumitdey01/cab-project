import React from 'react';

export default function SafarExpressLogo() {
  return (
    <div className="flex items-center gap-3 cursor-pointer group transition-transform origin-left sm:scale-100 scale-90">
      <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_15px_rgba(59,130,246,0.5)] border-2 border-white z-10">
        <span className="text-2xl font-black text-white tracking-tighter drop-shadow-md">
          SE
        </span>

        <div className="absolute inset-[-4px] rounded-full animate-[spin_5s_linear_infinite]">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center justify-center w-7 h-7 bg-white rounded-full shadow-md border border-slate-100 rotate-90">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-slate-800 drop-shadow-sm transform -rotate-90"
            >
              <path d="M21.5 10.5l-3-3.5C17.5 6 16 5.5 14 5.5H7.5C5.5 5.5 4 6.5 3.2 8.5L2 12.5C1.5 13 1 13.5 1 14.5V16c0 1 .5 1.5 1.5 1.5H4c.5 1.5 2 2.5 3.5 2.5s3-.1 3.5-2.5h2c.5 1.5 2 2.5 3.5 2.5s3-1 3.5-2.5h1.5c1 0 1.5-.5 1.5-1.5v-3c0-1-.5-2-1.5-2.5z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center z-10">
        <span className="text-2xl font-extrabold text-blue-950 tracking-tight leading-none group-hover:text-blue-600 transition-colors duration-300">
          SAFAREXPRESS
        </span>
      </div>
    </div>
  );
}
