import axios from 'axios';

let warming = null;
let warmState = { status: 'idle', lastError: null };

export function getWarmState() {
  return warmState;
}

export async function warmBackend() {
  if (warming) return warming;

  warmState = { status: 'warming', lastError: null };
  const baseUrl = process.env.REACT_APP_API_URL;
  if (!baseUrl) {
    warmState = { status: 'ready', lastError: null };
    return null;
  }

  console.log(`Waking up backend at ${baseUrl}`);
  warming = axios.get(`${baseUrl}/health`, { timeout: 60000 })
    .then((res) => {
      warmState = { status: 'ready', lastError: null };
      return res.data;
    })
    .catch((err) => {
      warmState = { status: 'warming', lastError: err };
      return null;
    })
    .finally(() => {
      warming = null;
    });

  return warming;
}
