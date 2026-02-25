export const API_BASE_URL = process.env.REACT_APP_API_URL;
if (!API_BASE_URL) {
  console.error('REACT_APP_API_URL is missing! Production handshake will fail.');
}
