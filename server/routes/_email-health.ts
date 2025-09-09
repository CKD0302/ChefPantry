import { Router } from 'express';
import { sendEmail } from '../lib/email';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const to = (req.query.to as string) || 'you@example.com';
    await sendEmail(to, 'Chef Pantry email health', '<b>ok</b>');
    return res.json({ ok: true });
  } catch (e: any) {
    console.error('email-health failed:', e?.message || e);
    return res.status(500).json({ ok: false, error: e?.message || 'send failed' });
  }
});

export default router;