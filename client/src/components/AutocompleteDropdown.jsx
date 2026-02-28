import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { popularDestinations } from '../data/popularDestinations';

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function AutocompleteDropdown({ label, placeholder, value, onChange, showPopular = false }) {
  const [options, setOptions] = useState([]);
  const [query, setQuery] = useState(value?.name || '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const debouncedQuery = useDebouncedValue(query, 200);
  const minChars = 3;

  useEffect(() => {
    let active = true;
    fetch('/north_india_locations_optimized.json')
      .then((res) => res.json())
      .then((data) => {
        if (active) setOptions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setOptions([]);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setQuery(value?.name || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchesQuery = (loc, q) => {
    const name = String(loc.name || '').toLowerCase();
    const hub = String(loc.hub || '').toLowerCase();
    const keywords = Array.isArray(loc.keywords) ? loc.keywords.join(' ') : String(loc.keywords || '');
    return name.includes(q) || hub.includes(q) || keywords.toLowerCase().includes(q);
  };

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q || q.length < minChars) return [];
    const popMatches = popularDestinations.filter((loc) => matchesQuery(loc, q));
    if (popMatches.length > 0) return popMatches.slice(0, 20);
    return options.filter((loc) => matchesQuery(loc, q)).slice(0, 20);
  }, [options, debouncedQuery]);

  function handleSelect(item) {
    onChange?.(item);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600" size={18} />
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(next.trim().length >= minChars);
            if (onChange && next === '') onChange(null);
          }}
          onFocus={() => setOpen(showPopular)}
          className="w-full pl-11 pr-4 py-4 bg-white/80 border border-white/40 rounded-xl text-slate-700 font-medium appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition"
          autoComplete="off"
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-white/60 bg-white/90 shadow-lg">
          {showPopular && (!debouncedQuery || debouncedQuery.trim().length < minChars) && (
            <div className="px-4 py-2 text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Popular Destinations
            </div>
          )}
          {showPopular && (!debouncedQuery || debouncedQuery.trim().length < minChars) && (
            popularDestinations.slice(0, 12).map((item) => (
              <button
                key={`popular-${item.id}`}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-2"
              >
                <MapPin size={16} className="text-indigo-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                </div>
              </button>
            ))
          )}
          {filtered.map((item) => (
            <button
              key={`search-${item.id || item.name}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-2"
            >
              <MapPin size={16} className="text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
