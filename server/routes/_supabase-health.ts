import { Router } from 'express';
import { ipv4Fetch } from '../lib/ipv4Fetch';
import WebSocket from 'ws';

const router = Router();
const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Simple REST/Auth/Storage HEAD checks
async function headOk(path: string) {
  const r = await ipv4Fetch(`${url}${path}`, { method: 'HEAD', headers: { apikey: key } });
  return r.ok;
}

router.get('/', async (req, res) => {
  try {
    const rest = await headOk('/rest/v1/');
    const auth = await headOk('/auth/v1/');
    const storage = await headOk('/storage/v1/');
    res.json({ ok: rest && auth && storage, rest, auth, storage });
  } catch (e: any) {
    console.error('Supabase health error:', e?.message || e);
    res.status(500).json({ ok: false, error: e?.message || 'health failed' });
  }
});

// Realtime websocket probe (best-effort)
router.get('/realtime', async (req, res) => {
  try {
    const ref = (new URL(process.env.SUPABASE_URL!)).host.split('.')[0]; // project-ref
    const wsUrl = `wss://${ref}.supabase.co/realtime/v1/websocket?apikey=${key}&vsn=1.0.0`;
    const ws = new WebSocket(wsUrl, { family: 4 }); // ws supports `family` via Node lookup
    let done = false;
    ws.on('open', () => { done = true; ws.close(); res.json({ ok: true }); });
    ws.on('error', (err) => { if (!done) { done = true; res.status(500).json({ ok: false, error: String(err) }); } });
    setTimeout(() => { if (!done) { done = true; try { ws.terminate(); } catch {} res.status(504).json({ ok: false, error: 'timeout' }); } }, 5000);
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'realtime failed' });
  }
});

export default router;