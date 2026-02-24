import React from 'react';

export function Alert({ type = 'info', message }) {
  if (!message) return null;

  const color = {
    info: 'text-sky-700 bg-sky-100',
    error: 'text-red-700 bg-red-100',
    success: 'text-emerald-700 bg-emerald-100',
  }[type] || 'text-slate-700 bg-slate-100';

  return <p className={`rounded-lg px-3 py-2 text-sm font-medium ${color}`}>{message}</p>;
}