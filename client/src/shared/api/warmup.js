import axios from 'axios';

let warming = null;
let warmState = { status: 'idle', lastError: null };

export function getWarmState() {
  return warmState;
}

export async function warmBackend() {
  if (warming) return warming;

  warmState = { status: 'pending', lastError: null };
  const baseUrl = (() => {
    try {
      // eslint-disable-next-line no-new-func
      return Function('return import.meta.env && import.meta.env.VITE_API_URL')();
    } catch (err) {
      return undefined;
    }
  })();
  if (!baseUrl) {
    warmState = { status: 'ready', lastError: null };
    return null;
  }

  console.log(`Waking up backend at ${baseUrl}`);
  warming = axios.get(`${baseUrl}/api/v1/health`, { timeout: 60000 })
    .then((res) => {
      warmState = { status: 'ready', lastError: null };
      return res.data;
    })
    .catch((err) => {
      warmState = { status: 'pending', lastError: err };
      return null;
    })
    .finally(() => {
      warming = null;
    });

  return warming;
}
