import React from 'react';

export function SafarExpressLogo() {
  return (
    <div className="flex items-center gap-3 cursor-pointer group transition-transform origin-left scale-90 sm:scale-100">
      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_15px_rgba(59,130,246,0.5)] border-2 border-white z-10 flex items-center justify-center">
        <span className="text-2xl font-black text-white tracking-tighter drop-shadow-md">SX</span>
        <div className="absolute inset-[-2px] rounded-full animate-[spin_4s_linear_infinite]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 bg-zinc-900 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.4)] border border-zinc-950">
            <div className="flex items-center justify-center w-3.5 h-3.5 bg-zinc-300 rounded-full border-[2px] border-dashed border-zinc-500">
              <div className="w-1 h-1 bg-zinc-800 rounded-full" />
            </div>
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
