import React from 'react';

const CONFIG = {
  error: {
    wrapper: 'bg-red-50 border border-red-200 text-red-800',
    icon: (
      <svg className="w-5 h-5 shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    title: 'Something went wrong',
  },
  success: {
    wrapper: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
    icon: (
      <svg className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    title: 'Success',
  },
  info: {
    wrapper: 'bg-sky-50 border border-sky-200 text-sky-800',
    icon: (
      <svg className="w-5 h-5 shrink-0 text-sky-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Info',
  },
};

/**
 * Alert component.
 * `message` can be:
 *   - a plain string  →  shown as one line
 *   - a string with " • " separators  →  shown as a bullet list (from parseApiError)
 */
export function Alert({ type = 'info', message }) {
  if (!message) return null;

  const cfg = CONFIG[type] || CONFIG.info;

  // Split on the bullet separator produced by parseApiError
  const parts = typeof message === 'string'
    ? message.split(' • ').map((s) => s.trim()).filter(Boolean)
    : [String(message)];

  const isList = parts.length > 1;

  return (
    <div
      className={`flex gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-sm animate-[fadeIn_0.2s_ease] ${cfg.wrapper}`}
      role="alert"
    >
      {cfg.icon}
      <div className="flex-1 min-w-0">
        {isList ? (
          <>
            <p className="font-semibold mb-1">{cfg.title}</p>
            <ul className="list-disc list-inside space-y-0.5 text-sm font-normal opacity-90">
              {parts.map((part, i) => (
                <li key={i}>{part}</li>
              ))}
            </ul>
          </>
        ) : (
          <span>{parts[0]}</span>
        )}
      </div>
    </div>
  );
}