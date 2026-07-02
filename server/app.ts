import 'dotenv/config';
import express from 'express';
import paystackRoutes from './paystack.js';
import notificationRoutes from './notifications.js';
import eodRoutes from './eod.js';
import geminiRoutes from './gemini.js';
import { parseBankAlert } from './emailParser.js';

// Distributed rate limiter — see supabase/migrations/20260702_rate_limiting.sql
// for why this replaced the old in-memory Map version: on Vercel, concurrent
// serverless invocations each get their own process memory, so an in-memory
// counter doesn't actually enforce a shared limit. This checks a shared table
// instead, using the same FOR UPDATE pattern as allocate_awb(). Costs a
// network round trip per check (~120ms, Supabase is EU West) — only wire
// this onto low-frequency, deliberate actions, not hot-path UI calls.
const rateLimiter = (name: string, maxReqs: number, windowMs: number) => {
  return async (req: any, res: any, next: any) => {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceKey) {
        // Not configured — fail open, same philosophy as before.
        return next();
      }

      const { createClient } = await import('@supabase/supabase-js');
      const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

      const ip = req.ip || 'unknown';
      const key = `${name}:${ip}`;

      const { data: allowed, error } = await admin.rpc('check_rate_limit', {
        p_key: key,
        p_max: maxReqs,
        p_window_ms: windowMs,
      });

      if (error) {
        // Fail open — a broken rate limiter should never block a legitimate request
        console.error('Rate limiter check failed (failing open):', error);
        return next();
      }

      if (allowed === false) {
        return res.status(429).json({ error: 'Too many requests' });
      }

      next();
    } catch (err) {
      // Fail open — a broken rate limiter should never block a legitimate request
      console.error('Rate limiter error (failing open):', err);
      next();
    }
  };
};

async function requireAdminCaller(req: any, res: any): Promise<{ admin: any; supabaseUrl: string; serviceKey: string; callerRole: string; callerId: string } | null> {
  try {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    if (!token) { res.status(401).json({ error: 'Unauthorized' }); return null; }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      res.status(503).json({ error: 'Service key or Supabase URL not configured on server' });
      return null;
    }

    const { createClient } = await import('@supabase/supabase-js');
    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: { user }, error } = await admin.auth.getUser(token);

    if (error || !user) { res.status(401).json({ error: 'Invalid token: ' + (error?.message || 'no user') }); return null; }

    const { data: profile, error: profileErr } = await admin.from('user_profiles').select('role').eq('id', user.id).single();
    if (profileErr) { res.status(500).json({ error: 'Failed to load caller profile: ' + profileErr.message }); return null; }
    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      res.status(403).json({ error: 'Forbidden' }); return null;
    }
    return { admin, supabaseUrl, serviceKey, callerRole: profile.role, callerId: user.id };
  } catch (err: any) {
    console.error('requireAdminCaller error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Auth check failed: ' + (err?.message || 'unknown error') });
    }
    return null;
  }
}

async function requireAuthenticatedUser(req: any, res: any, next: any) {
  try {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) { res.status(503).json({ error: 'Supabase not configured on server' }); return; }

    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(supabaseUrl, anonKey);
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) { res.status(401).json({ error: 'Invalid session' }); return; }

    next();
  } catch (err: any) {
    console.error('requireAuthenticatedUser error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Auth check failed' });
  }
}

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '2mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  const notifyLimiter = rateLimiter('notify', 30, 60_000);
  const adminLimiter = rateLimiter('admin', 10, 60_000);

  app.get('/api/config', (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      res.json({ configured: true, supabaseUrl, supabaseAnonKey });
    } else {
      res.json({ configured: false });
    }
  });

  app.use('/api/paystack', paystackRoutes);
  app.use('/api/notify', notifyLimiter, notificationRoutes);
  app.use('/api/eod', eodRoutes);
  app.use('/api/gemini', notifyLimiter, requireAuthenticatedUser, geminiRoutes);

  app.post('/api/admin/create-staff', adminLimiter, async (req, res) => {
    const adminCtx = await requireAdminCaller(req, res);
    if (!adminCtx) return;
    const { adminClient } = { adminClient: adminCtx.admin };

    const { name, email, password, role, hub_id, hub_type, phone } = req.body;
    if (!name || !email || !password || !role || !hub_id) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password, role, hub_id' });
    }

    try {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role, hub_type, hub_id }
      });

      if (authError || !authData.user) {
        return res.status(400).json({ error: authError?.message || 'Failed to create auth user' });
      }

      const { error: profileError } = await adminClient
        .from('user_profiles')
        .upsert({ id: authData.user.id, email: email, name, role, hub_id, hub_type: hub_type || 'Cargo Station', phone: phone || null, active: true });

      if (profileError) {
        console.error('Profile update failed:', profileError.message);
      }

      return res.json({ id: authData.user.id, email: authData.user.email });
    } catch (err: any) {
      console.error('create-staff error:', err);
      return res.status(500).json({ error: err.message || 'Server error' });
    }
  });

  app.post('/api/admin/set-staff-active', adminLimiter, async (req, res) => {
    const adminCtx = await requireAdminCaller(req, res);
    if (!adminCtx) return;
    const { admin: adminClient } = adminCtx;

    const { userId, active } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
      const { error } = await adminClient.from('user_profiles').update({ active }).eq('id', userId);
      if (error) return res.status(400).json({ error: error.message });

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

  app.post('/api/admin/update-staff', adminLimiter, async (req, res) => {
    const adminCtx = await requireAdminCaller(req, res);
    if (!adminCtx) return;
    const { admin: adminClient } = adminCtx;

    const { userId, updates } = req.body;
    if (!userId || !updates) return res.status(400).json({ error: 'Missing userId or updates' });

    // Only an existing super_admin may grant super_admin to someone else.
    // Without this check, any admin (the next tier down, which already has
    // Staff Management access) could self-escalate or promote an arbitrary
    // account to super_admin via this generic update path.
    if (updates.role === 'super_admin' && adminCtx.callerRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only a super_admin can grant the super_admin role.' });
    }

    try {
      const { error } = await adminClient.from('user_profiles').update(updates).eq('id', userId);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/validate-payment/parse', (req, res) => {
    try {
      const { emailText } = req.body;
      if (!emailText) {
        return res.status(400).json({ error: 'Missing emailText' });
      }
      const parsed = parseBankAlert(emailText);
      res.json(parsed);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Failed to parse bank alert' });
    }
  });

  app.post('/api/validate-payment/inbound', (req, res) => {
    try {
      const { TextBody, HtmlBody } = req.body;
      const emailText = TextBody || (HtmlBody ? HtmlBody.replace(/<[^>]+>/g, '') : '');
      if (!emailText) {
        return res.status(400).json({ error: 'Missing email body' });
      }
      const parsed = parseBankAlert(emailText);
      res.json(parsed);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Failed to parse inbound email' });
    }
  });

  // Catch-all for any /api/* path that didn't match a registered route above —
  // without this, an unmatched sub-path falls through to Express's default
  // 404 page (HTML, not JSON), which the client can't parse for a useful message.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `No API route matches ${req.method} ${req.originalUrl}` });
  });

  // Global error handler — MUST be registered last, and MUST have exactly
  // 4 parameters for Express to recognise it as an error handler. This is
  // the final safety net: any error thrown anywhere above that wasn't
  // caught by a route's own try/catch lands here instead of producing
  // Express's raw, non-JSON default error response.
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled API error:', err);
    if (res.headersSent) return next(err);
    res.status(err.status || err.statusCode || 500).json({
      error: err.message || 'Unexpected server error',
    });
  });

  return app;
}
