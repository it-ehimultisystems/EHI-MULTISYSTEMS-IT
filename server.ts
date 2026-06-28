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

  // ── STAFF MANAGEMENT ─────────────────────────────────────────────
  // Requires SUPABASE_SERVICE_ROLE_KEY in environment
  app.post('/api/admin/create-staff', async (req, res) => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
      return res.status(503).json({ error: 'Service key not configured. Add SUPABASE_SERVICE_ROLE_KEY to Vercel env vars.' });
    }

    const { name, email, password, role, hub_id, hub_type, phone } = req.body;
    if (!name || !email || !password || !role || !hub_id) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password, role, hub_id' });
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const adminClient = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // Create auth user (bypasses email confirmation)
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role, hub_type }
      });

      if (authError || !authData.user) {
        return res.status(400).json({ error: authError?.message || 'Failed to create auth user' });
      }

      // Update profile with correct hub and role
      // (trigger already created a basic profile, now we set the real values)
      const { error: profileError } = await adminClient
        .from('user_profiles')
        .update({ name, role, hub_id, hub_type: hub_type || 'Cargo Station', phone: phone || null, active: true })
        .eq('id', authData.user.id);

      if (profileError) {
        // Auth user created but profile update failed — log it but don't fail
        console.error('Profile update failed:', profileError.message);
      }

      return res.json({ id: authData.user.id, email: authData.user.email });
    } catch (err: any) {
      console.error('create-staff error:', err);
      return res.status(500).json({ error: err.message || 'Server error' });
    }
  });

  // Deactivate / reactivate a staff account (sets active flag)
  app.post('/api/admin/set-staff-active', async (req, res) => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
      return res.status(503).json({ error: 'Service key not configured' });
    }
    const { userId, active } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const adminClient = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { error } = await adminClient.from('user_profiles').update({ active }).eq('id', userId);
      if (error) return res.status(400).json({ error: error.message });

      // Also ban/unban in Supabase Auth to prevent login
      if (!active) {
        await adminClient.auth.admin.updateUserById(userId, { ban_duration: '876600h' });
      } else {
        await adminClient.auth.admin.updateUserById(userId, { ban_duration: 'none' });
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

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
