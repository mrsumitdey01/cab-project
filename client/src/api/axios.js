import axios from 'axios';

export const API_URL = import.meta?.env?.VITE_API_URL;
if (!API_URL) {
  console.error('VITE_API_URL is missing! Production handshake will fail.');
}

export const axiosClient = axios.create({
  baseURL: API_URL || '/api/v1',
  timeout: 60000,
});
