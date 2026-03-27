import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Starting SyncMusic server...");
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Global state
  let musicState = {
    url: "",
    isPlaying: false,
    isEnabled: false,
    currentTime: 0,
    lastUpdated: Date.now(),
  };

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.emit("musicStateUpdate", musicState);

    socket.on("updateMusicState", (newState) => {
      console.log("Updating music state:", newState);
      musicState = { ...musicState, ...newState, lastUpdated: Date.now() };
      io.emit("musicStateUpdate", musicState);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware attached.");
  } else {
    console.log("Running in production mode.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> SyncMusic server is LIVE at http://0.0.0.0:${PORT}`);
  });
}

startServer();
