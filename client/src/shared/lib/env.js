const defaultBase = 'http://localhost:5000';
const defaultPrefix = '/api/v1';

const rawBase = process.env.REACT_APP_API_URL || process.env.VITE_API_URL || '';
const rawPrefix = process.env.REACT_APP_API_PREFIX || process.env.VITE_API_PREFIX || '';

export const API_BASE_URL = rawBase || defaultBase;
export const API_PREFIX = rawPrefix || defaultPrefix;

export function buildApiUrl(path) {
  return `${API_BASE_URL}${API_PREFIX}${path}`;
}
