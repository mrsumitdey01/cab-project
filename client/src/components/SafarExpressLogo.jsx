import React from 'react';

export function SafarExpressLogo() {
  return (
    <div className="flex items-center gap-3 cursor-pointer group">
      <div className="relative w-14 h-14 rounded-full bg-slate-900 shadow-md border-2 border-slate-100 flex items-center justify-center">
        <span className="text-2xl font-black text-white tracking-tighter">SE</span>
        <div className="absolute inset-0 rounded-full animate-[spin_3s_linear_infinite]">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-800 border-[2px] border-slate-300 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
          </div>
        </div>
      </div>
      <div>
        <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors duration-300">
          SAFAREXPRESS CABS
        </span>
      </div>
    </div>
  );
}
