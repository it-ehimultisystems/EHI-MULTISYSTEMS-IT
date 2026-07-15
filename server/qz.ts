import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// QZ Tray only skips its "allow this site to print?" prompt once every
// print request is signed by a certificate it's been told to trust. The
// private key must never reach the browser, so signing happens here --
// both env vars are a one-time ops step (generate a self-signed cert/key
// pair, register the cert in QZ Tray, set these two vars) documented in
// the deployment notes, not something this code generates.
router.get('/cert', (_req, res) => {
  const cert = process.env.QZ_CERTIFICATE;
  if (!cert) {
    return res.status(503).json({ error: 'QZ_CERTIFICATE not configured on server' });
  }
  res.type('text/plain').send(cert);
});

router.post('/sign', (req, res) => {
  const privateKey = process.env.QZ_PRIVATE_KEY;
  if (!privateKey) {
    return res.status(503).json({ error: 'QZ_PRIVATE_KEY not configured on server' });
  }
  const { request } = req.body;
  if (typeof request !== 'string' || !request) {
    return res.status(400).json({ error: 'Missing request string to sign' });
  }
  try {
    const signer = crypto.createSign('SHA512');
    signer.update(request);
    signer.end();
    const signature = signer.sign(privateKey, 'base64');
    res.json({ signature });
  } catch (err: any) {
    console.error('QZ signing failed:', err);
    res.status(500).json({ error: err.message || 'Signing failed' });
  }
});

export default router;
