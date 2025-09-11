// CRITICAL: DNS configuration must be FIRST before any other imports
import dns from 'node:dns';

// Configure DNS with multiple reliable servers for production resilience  
dns.setServers([
  '1.1.1.1',      // Cloudflare primary
  '1.0.0.1',      // Cloudflare secondary  
  '8.8.8.8',      // Google primary
  '8.8.4.4'       // Google secondary
]);

// Set IPv4 preference for better compatibility
dns.setDefaultResultOrder('ipv4first');

// Force IPv4 for all global fetch/HTTP in Node via undici
import { Agent, setGlobalDispatcher } from 'undici';
const ipv4Agent = new Agent({ connect: { family: 4 } });
setGlobalDispatcher(ipv4Agent);

// Set via env for Node internals (defensive)
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

// Log DNS configuration in development only
if (process.env.NODE_ENV === 'development') {
  console.log('[DNS] Configured servers:', dns.getServers());
  console.log('[DNS] Result order:', dns.getDefaultResultOrder());
  console.log('[DNS] NODE_OPTIONS:', process.env.NODE_OPTIONS);
}

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add Supabase health check endpoint
import supabaseHealth from './routes/_supabase-health';
app.use('/api/_supabase-health', supabaseHealth);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Email health endpoint - add after registerRoutes
  app.get('/api/_email-health', async (req, res) => {
    try {
      const to = req.query.to as string;
      
      if (!to) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Email address "to" parameter is required' 
        });
      }
      
      const { sendEmail } = await import('./lib/email');
      await sendEmail(to, 'Chef Pantry email health', '<b>ok</b>');
      return res.json({ ok: true });
    } catch (e: any) {
      console.error('email-health failed:', e?.message || e);
      return res.status(500).json({ ok: false, error: e?.message || 'send failed' });
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
