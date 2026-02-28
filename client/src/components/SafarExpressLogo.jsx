import React from 'react';

export function SafarExpressLogo() {
  return (
    <div className="flex items-center gap-3 cursor-pointer group transition-transform origin-left scale-90 sm:scale-100">
      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_15px_rgba(59,130,246,0.5)] border-2 border-white z-10 flex items-center justify-center">
        <span className="text-2xl font-black text-white tracking-tighter drop-shadow-md">SE</span>
        <div className="absolute inset-[-4px] rounded-full animate-[spin_5s_linear_infinite]">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-slate-800 drop-shadow-md">
            <div className="bg-white rounded-full px-1 py-0.5 border border-slate-200">
              <svg width="28" height="14" viewBox="0 0 24 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.5 6.5C22.5 5.5 21.5 4.8 20.2 4.5L16.5 3.5C15.5 3.2 14.2 2.5 13.5 2L10.5 1.2C9.5 0.9 8.2 1 7.2 1.5L4.5 2.5C3.2 3 2 4.2 1.5 5.5L1 7C0.5 7.2 0 7.8 0 8.5C0 9.3 0.7 10 1.5 10H2.2C2.6 11.2 3.7 12 5 12C6.3 12 7.4 11.2 7.8 10H15.2C15.6 11.2 16.7 12 18 12C19.3 12 20.4 11.2 20.8 10H22.5C23.3 10 24 9.3 24 8.5V7.5C24 6.9 23.3 6.6 22.5 6.5ZM5 10.8C4.2 10.8 3.5 10.1 3.5 9.2C3.5 8.4 4.2 7.8 5 7.8C5.8 7.8 6.5 8.4 6.5 9.2C6.5 10.1 5.8 10.8 5 10.8ZM18 10.8C17.2 10.8 16.5 10.1 16.5 9.2C16.5 8.4 17.2 7.8 18 7.8C18.8 7.8 19.5 8.4 19.5 9.2C19.5 10.1 18.8 10.8 18 10.8ZM16 5.5H8.5V3.2L11.5 2.5C12.2 2.8 13.2 3.5 14 3.8L16 4.2V5.5Z" />
              </svg>
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
