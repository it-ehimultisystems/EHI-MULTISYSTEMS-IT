import { Router } from 'express';
import axios from 'axios';

const router = Router();

// POST /api/notify/whatsapp
// Sends a WhatsApp message via Termii
router.post('/whatsapp', async (req, res) => {
  const { phone, message, ref } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message required' });
  }

  const apiKey = process.env.TERMII_API_KEY;

  if (!apiKey) {
    // No Termii key — log and return success for demo
    console.log(`[DEMO WhatsApp] → ${phone} | Ref: ${ref}\n${message}`);
    return res.json({ ok: true, demo: true });
  }

  try {
    const response = await axios.post(
      'https://api.ng.termii.com/api/sms/send',
      {
        to: phone,
        from: 'EHI Logistics',   // must match your Termii sender ID
        sms: message,
        type: 'unicode',
        channel: 'whatsapp',     // ← this is what makes it WhatsApp
        api_key: apiKey,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000,
      }
    );

    return res.json({ ok: true, termii: response.data });
  } catch (err: any) {
    console.error('Termii WhatsApp error:', err?.response?.data || err.message);
    return res.status(500).json({
      ok: false,
      error: err?.response?.data || 'Termii request failed',
    });
  }
});

export default router;
