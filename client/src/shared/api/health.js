import { http } from './http';

export async function prewarmHealth() {
  try {
    await http.get('/health/ready');
    return true;
  } catch (err) {
    return false;
  }
}
