import React from 'react';

export default function SafarExpressLogo() {
  return (
    <div className="flex items-center gap-6 cursor-pointer group">
      <div className="relative w-48 h-48 bg-slate-900 rounded-full shadow-[inset_0_0_30px_rgba(59,130,246,0.25)] flex items-center justify-center">
        <div className="absolute inset-6 rounded-full border-2 border-dashed border-blue-500/50" />

        <div className="relative text-center z-10">
          <div className="text-5xl font-black bg-gradient-to-br from-blue-400 to-blue-700 bg-clip-text text-transparent leading-none">
            SE
          </div>
          <div className="text-sm font-semibold tracking-wide bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
            Safar
          </div>
        </div>

        <div className="absolute inset-0 animate-[spin_5s_linear_infinite]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="relative w-20 h-8 bg-white rounded-full shadow-md">
              <div className="absolute right-2 top-1.5 w-5 h-3 bg-slate-700 rounded-sm" />
              <div className="absolute right-8 top-1.5 w-6 h-3 bg-slate-700 rounded-sm" />
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] rounded-full" />
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-300 shadow-[0_0_6px_rgba(253,224,71,0.6)] rounded-full" />

              <div className="absolute left-4 -bottom-2 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center animate-[spin_1s_linear_infinite]">
                <div className="w-2 h-2 bg-slate-400 rounded-full" />
              </div>
              <div className="absolute right-4 -bottom-2 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center animate-[spin_1s_linear_infinite]">
                <div className="w-2 h-2 bg-slate-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <span className="text-2xl font-extrabold text-blue-950 tracking-tight leading-none group-hover:text-blue-600 transition-colors duration-300">
          SAFAREXPRESS
        </span>
      </div>
    </div>
  );
}
