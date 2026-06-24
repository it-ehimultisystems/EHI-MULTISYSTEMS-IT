import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import paystackRoutes from './server/paystack';
import notificationRoutes from './server/notifications';

import eodRoutes from './server/eod';
import geminiRoutes from './server/gemini';
import { parseBankAlert } from './server/emailParser';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Supabase runtime config exposure
  app.get('/api/config', (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      res.json({ configured: true, supabaseUrl, supabaseAnonKey });
    } else {
      res.json({ configured: false });
    }
  });

  // API routes
  app.use('/api/paystack', paystackRoutes);
  app.use('/api/notify', notificationRoutes);
  app.use('/api/eod', eodRoutes);
  app.use('/api/gemini', geminiRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post('/api/validate-payment/parse', (req, res) => {
    try {
      const { emailText } = req.body;
      if (!emailText) {
        return res.status(400).json({ error: "Missing emailText" });
      }
      const parsed = parseBankAlert(emailText);
      res.json(parsed);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Failed to parse bank alert" });
    }
  });

  app.post('/api/validate-payment/inbound', (req, res) => {
    try {
      const { TextBody, HtmlBody } = req.body;
      const emailText = TextBody || (HtmlBody ? HtmlBody.replace(/<[^>]+>/g, '') : '');
      if (!emailText) {
        return res.status(400).json({ error: "Missing email body" });
      }
      const parsed = parseBankAlert(emailText);
      
      // If server has DB access, we could auto-match here.
      // For now, just return parsed data. Client can also poll or we let client do it.
      res.json(parsed);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Failed to parse inbound email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
