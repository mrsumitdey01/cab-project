export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const API_PREFIX = process.env.REACT_APP_API_PREFIX || '/api/v1';

export function buildApiUrl(path) {
  return `${API_BASE_URL}${API_PREFIX}${path}`;
}