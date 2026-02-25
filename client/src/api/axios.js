import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL;
if (!API_URL) {
  console.error('REACT_APP_API_URL is missing! Production handshake will fail.');
}

export const axiosClient = axios.create({
  baseURL: API_URL || '/api/v1',
  timeout: 60000,
});
