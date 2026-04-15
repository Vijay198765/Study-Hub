import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import webpush from "web-push";

dotenv.config();

const __filename = fileURLToPath(import.meta.env?.url || import.meta.url);
const __dirname = path.dirname(__filename);

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || 'BKT1ZB7Mhnw0JtUI73xwb_bKSWsMRIHc_n13mkg3IyaXMpjTgaXIUFiJLyLAx9yCJ-5CGtBmiHpo0xAMW-yKuos';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'H4jOT-_i-T03-RoplS0-baSFxSrJRj02ibavGqxC3eQ';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:vijayninama683@gmail.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/send-push", async (req, res) => {
    const { subscriptions, title, body, url } = req.body;

    if (!subscriptions || !Array.isArray(subscriptions)) {
      return res.status(400).json({ error: "Invalid subscriptions" });
    }

    const notificationPayload = JSON.stringify({ title, body, url });

    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        webpush.sendNotification(JSON.parse(sub), notificationPayload)
      )
    );

    res.json({ success: true, results });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
