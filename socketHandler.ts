import { Server, Socket } from "socket.io";
import * as http from "http";

interface Player {
  id: string;
  username: string;
  segments: { x: number; y: number }[];
  angle: number;
  score: number;
  kills: number;
  skinId: string;
  color: string;
  headColor: string;
  isBoosting: boolean;
  avatar: string;
  survivalStart: number;
  rank: number;
  isBanned?: boolean;
}

interface Pellet {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  type: 'normal' | 'speed' | 'mega' | 'glowing';
  points: number;
}

interface Lobby {
  roomId: string;
  isPrivate: boolean;
  players: Map<string, Player>;
  pellets: Pellet[];
  chatHistory: { username: string; text: string; time: number; type: 'global' | 'team' }[];
}

const MAP_SIZE = 2500;
const MAX_BOOST_SPEED = 7.0;
const BASE_SPEED = 3.6;

// Track active lobbies and banned players list
const lobbies = new Map<string, Lobby>();
const bannedUsers = new Set<string>();

function getOrCreateLobby(roomId: string, isPrivate: boolean): Lobby {
  let lobby = lobbies.get(roomId);
  if (!lobby) {
    lobby = {
      roomId,
      isPrivate,
      players: new Map(),
      pellets: [],
      chatHistory: []
    };
    // Initialize standard food pellet distribution
    spawnPellets(lobby, 350);
    // Spawn initial bots to make the arena active and satisfying (Snake.io experience)
    spawnLobbyBots(lobby, 15);
    lobbies.set(roomId, lobby);
  }
  return lobby;
}

function spawnPellets(lobby: Lobby, count: number) {
  const PELLET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#14b8a6', '#eab308'];
  const TYPES: ('normal' | 'speed' | 'mega' | 'glowing')[] = ['normal', 'normal', 'normal', 'speed', 'mega', 'glowing'];

  for (let i = 0; i < count; i++) {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    let size = 6;
    let points = 5;
    let color = PELLET_COLORS[Math.floor(Math.random() * PELLET_COLORS.length)];

    if (type === 'speed') {
      size = 9;
      points = 12;
      color = '#00ffff'; // Electric cyan
    } else if (type === 'mega') {
      size = 12;
      points = 25;
      color = '#ffd700'; // Pure bright gold
    } else if (type === 'glowing') {
      size = 15;
      points = 50;
      color = '#ff00ff'; // Radiant purple
    }

    lobby.pellets.push({
      id: "p_" + Math.random().toString(36).substring(2, 9),
      x: Math.floor(Math.random() * (MAP_SIZE - 60)) + 30,
      y: Math.floor(Math.random() * (MAP_SIZE - 60)) + 30,
      size,
      color,
      type,
      points
    });
  }
}

function spawnLobbyBots(lobby: Lobby, count: number) {
  const BOT_NAMES = [
    'NeonStalker', 'CyberViper', 'TokyoDrifter', 'CarbonRazor', 'GigaSlayer',
    'SpectreJet', 'AcidWeb', 'QuantumFangs', 'ApexGlider', 'VaporWhip',
    'GlitchBoa', 'PixelPython', 'SynthVenom', 'OmegaNoodle', 'ChronoCobra'
  ];
  const BOT_COLORS = ['#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];

  for (let i = 0; i < count; i++) {
    const botId = `bot_${Math.random().toString(36).substring(2, 9)}`;
    const botName = `${BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]} 🤖`;
    const coreColor = BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)];
    
    const startX = Math.floor(Math.random() * (MAP_SIZE - 400)) + 200;
    const startY = Math.floor(Math.random() * (MAP_SIZE - 400)) + 200;
    const angle = Math.random() * Math.PI * 2;

    const segments = [];
    for (let s = 0; s < 12; s++) {
      segments.push({
        x: startX - Math.cos(angle) * s * 15,
        y: startY - Math.sin(angle) * s * 15
      });
    }

    lobby.players.set(botId, {
      id: botId,
      username: botName,
      segments,
      angle,
      score: 180,
      kills: 0,
      skinId: 'default',
      color: coreColor,
      headColor: coreColor,
      isBoosting: false,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bot',
      survivalStart: Date.now(),
      rank: 1
    });
  }
}

export function initSocketServer(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  console.log("🚀 Real-time WebSockets Live Server initialized");

  // Server tick rate configuration (30 ticks per second is high speed and optimal)
  const TICK_RATE = 30;
  const tickDuration = 1000 / TICK_RATE;

  // Active game loop update routine
  setInterval(() => {
    lobbies.forEach((lobby, roomId) => {
      const playersList = Array.from(lobby.players.values());
      const now = Date.now();

      // Update positions and handle collisions for bots & real players
      playersList.forEach((player) => {
        // Handle random bot decision steering
        const isBot = player.id.startsWith('bot_');
        if (isBot) {
          if (Math.random() < 0.04) {
            player.angle = Math.random() * Math.PI * 2;
          }
          // Bots randomly boost to capture food or attack
          if (Math.random() < 0.02) {
            player.isBoosting = player.segments.length > 8 && Math.random() < 0.5;
          }
        }

        const head = player.segments[0];
        if (!head) return;

        // Smooth velocity calculation based on boost timers
        const actualSpeed = player.isBoosting && player.segments.length > 6 
          ? MAX_BOOST_SPEED 
          : BASE_SPEED;

        // Create new coordinates
        let nextHeadX = head.x + Math.cos(player.angle) * actualSpeed;
        let nextHeadY = head.y + Math.sin(player.angle) * actualSpeed;

        // Anti-cheat protections: Verify velocity limits (prevent speedhack)
        const moveDelta = Math.hypot(nextHeadX - head.x, nextHeadY - head.y);
        if (moveDelta > MAX_BOOST_SPEED + 1.5) {
          // Flagged for anomalous warp speed packet
          console.warn(`🔒 Triggered Anti-Speedhack protection on player ID ${player.id}`);
          nextHeadX = head.x + Math.cos(player.angle) * BASE_SPEED;
          nextHeadY = head.y + Math.sin(player.angle) * BASE_SPEED;
        }

        // Anti-teleport constraints: Bound coordinates to arena playfield limits safely
        if (nextHeadX < 10) nextHeadX = 10;
        if (nextHeadX > MAP_SIZE - 10) nextHeadX = MAP_SIZE - 10;
        if (nextHeadY < 10) nextHeadY = 10;
        if (nextHeadY > MAP_SIZE - 10) nextHeadY = MAP_SIZE - 10;

        // Sliding chain movement calculations
        const newSegments = [{ x: nextHeadX, y: nextHeadY }];
        const targetSpacing = 15;

        for (let s = 1; s < player.segments.length; s++) {
          const prevSeg = newSegments[s - 1];
          const curSeg = player.segments[s];
          const dist = Math.hypot(curSeg.x - prevSeg.x, curSeg.y - prevSeg.y);

          if (dist > targetSpacing) {
            const ratio = targetSpacing / dist;
            newSegments.push({
              x: prevSeg.x + (curSeg.x - prevSeg.x) * ratio,
              y: prevSeg.y + (curSeg.y - prevSeg.y) * ratio
            });
          } else {
            newSegments.push({ ...curSeg });
          }
        }

        // Update backing segments payload safely
        player.segments = newSegments;

        // Boost length reduction charge cycle (Shedding pellet trail seed mass)
        if (player.isBoosting && player.segments.length > 7 && Math.random() < 0.12) {
          const tail = player.segments.pop();
          if (tail) {
            lobby.pellets.push({
              id: "trail_" + Math.random().toString(36).substring(2, 9),
              x: tail.x + (Math.random() * 16 - 8),
              y: tail.y + (Math.random() * 16 - 8),
              size: 5,
              color: player.color,
              type: 'normal',
              points: 4
            });
          }
        }

        // Handle food ingestion checks
        lobby.pellets = lobby.pellets.filter((p) => {
          const dist = Math.hypot(p.x - nextHeadX, p.y - nextHeadY);
          if (dist < 18 + p.size) {
            // Grow tail segments proportional to energy load
            const growthAmt = p.type === 'mega' ? 2 : p.type === 'glowing' ? 3 : 1;
            const tail = player.segments[player.segments.length - 1] || head;

            for (let g = 0; g < growthAmt; g++) {
              if (player.segments.length < 250) {
                player.segments.push({ x: tail.x, y: tail.y });
              }
            }

            // Expand player scores on client score calculations
            player.score += p.points;
            return false; // Pelleted digested!
          }
          return true;
        });
      });

      // Maintain pellet replenishment threshold
      if (lobby.pellets.length < 280) {
        spawnPellets(lobby, 100);
      }

      // Handle Snake-on-Snake collision logic (Crash detection)
      const survivors = new Set<string>();
      const deceasedList: string[] = [];

      playersList.forEach((challenger) => {
        const challengerHead = challenger.segments[0];
        if (!challengerHead) return;

        let died = false;

        // Wall hit detection
        if (
          challengerHead.x <= 15 || 
          challengerHead.x >= MAP_SIZE - 15 || 
          challengerHead.y <= 15 || 
          challengerHead.y >= MAP_SIZE - 15
        ) {
          died = true;
        }

        // Body collisions: iterate through all other players segments
        if (!died) {
          for (const defender of playersList) {
            // Check if checking against self
            const isSelf = defender.id === challenger.id;
            
            // Start check index: if self, skip checking head collision index 0-3
            const startIndex = isSelf ? 4 : 0;

            for (let s = startIndex; s < defender.segments.length; s++) {
              const bSeg = defender.segments[s];
              const dist = Math.hypot(challengerHead.x - bSeg.x, challengerHead.y - bSeg.y);
              
              if (dist < 22) {
                died = true;
                // Add kill credit to defender if they are a different entity
                if (!isSelf) {
                  defender.kills = (defender.kills || 0) + 1;
                  defender.score += 250; // Mass slayer bounty
                  io.to(roomId).emit("kill_alert", {
                    killer: defender.username,
                    victim: challenger.username
                  });
                }
                break;
              }
            }
            if (died) break;
          }
        }

        if (died) {
          deceasedList.push(challenger.id);

          // Expel remnants of snake as harvestable food mass pellets! (Leave food on death!)
          challenger.segments.forEach((seg, index) => {
            if (index % 2 === 0) {
              lobby.pellets.push({
                id: "remnant_" + Math.random().toString(36).substring(2, 9),
                x: seg.x + (Math.random() * 20 - 10),
                y: seg.y + (Math.random() * 20 - 10),
                size: 8,
                color: challenger.color,
                type: 'normal',
                points: 8
              });
            }
          });
        } else {
          survivors.add(challenger.id);
        }
      });

      // Purge deceased entities from state
      deceasedList.forEach((id) => {
        lobby.players.delete(id);
        
        // Notify specific socket they died
        if (!id.startsWith('bot_')) {
          io.to(id).emit("player_death", {
            reason: "You crashed into another snake!"
          });
        }
      });

      // Respawn bot snakes to keep the action lively
      const currentBotCount = Array.from(lobby.players.keys()).filter((id) => id.startsWith('bot_')).length;
      if (currentBotCount < 14) {
        spawnLobbyBots(lobby, 14 - currentBotCount);
      }

      // Re-calculate live rankings for all online participants in this arena
      const activeRankList = Array.from(lobby.players.values()).sort((a, b) => b.score - a.score);
      activeRankList.forEach((p, idx) => {
        p.rank = idx + 1;
      });

      // Broadcast complete real-time synced snapshot inside the room socket tunnel
      io.to(roomId).emit("arena_sync", {
        players: activeRankList,
        pellets: lobby.pellets,
        leaderboard: activeRankList.slice(0, 10).map((p) => ({
          username: p.username,
          score: p.score,
          kills: p.kills,
          id: p.id,
          survivalTime: Math.floor((Date.now() - p.survivalStart) / 1000)
        }))
      });
    });
  }, tickDuration);

  // Connection management
  io.on("connection", (socket: Socket) => {
    let currentRoomId = "public_arena";
    let isSocketBanned = bannedUsers.has(socket.id);

    if (isSocketBanned) {
      socket.emit("banned", "Your device address has been banned by the administrator.");
      socket.disconnect();
      return;
    }

    // System diagnostics request
    socket.on("get_server_stats", () => {
      let totalOnline = 0;
      lobbies.forEach((lobby) => {
        lobby.players.forEach((p) => {
          if (!p.id.startsWith("bot_")) totalOnline++;
        });
      });

      socket.emit("server_stats_response", {
        onlineCount: totalOnline,
        lobbiesCount: lobbies.size,
        bannedCount: bannedUsers.size,
        uptime: process.uptime()
      });
    });

    // Handle Admin commands to flag, kick or ban players
    socket.on("admin_command", (data: { key: string; action: 'kick' | 'ban'; targetId: string }) => {
      // Validate secure admin key (matching developer guidelines)
      if (data.key !== "cyber_admin_secret_999") {
        socket.emit("chat_error", "Unauthorized administrator request!");
        return;
      }

      const playerToTriage = data.targetId;
      console.log(`🛡️ Admin actions: Action: ${data.action} on Target: ${playerToTriage}`);

      if (data.action === 'ban') {
        bannedUsers.add(playerToTriage);
      }

      const targetSocket = io.sockets.sockets.get(playerToTriage);
      if (targetSocket) {
        targetSocket.emit("banned", "You have been administrative banned from the arena server!");
        targetSocket.disconnect();
      }

      // Remove player entity representation from all lobbies
      lobbies.forEach((lobby) => {
        if (lobby.players.has(playerToTriage)) {
          lobby.players.delete(playerToTriage);
        }
      });

      // Broadcast update stats reflecting bans
      io.emit("admin_stats_changed");
    });

    // Enter Arena
    socket.on("join_arena", (info: { 
      roomId: string; 
      isPrivate: boolean; 
      username: string; 
      skinId: string; 
      color: string; 
      headColor: string; 
      avatar?: string;
    }) => {
      currentRoomId = info.roomId || "public_arena";
      socket.join(currentRoomId);

      const lobby = getOrCreateLobby(currentRoomId, info.isPrivate);

      // Start position safely in map
      const startX = Math.floor(Math.random() * (MAP_SIZE - 600)) + 300;
      const startY = Math.floor(Math.random() * (MAP_SIZE - 600)) + 300;
      const initAngle = Math.random() * Math.PI * 2;

      const segments = [];
      for (let s = 0; s < 12; s++) {
        segments.push({
          x: startX - Math.cos(initAngle) * s * 15,
          y: startY - Math.sin(initAngle) * s * 15
        });
      }

      const newPlayer: Player = {
        id: socket.id,
        username: info.username || "Spectre Gladiator",
        segments,
        angle: initAngle,
        score: 180,
        kills: 0,
        skinId: info.skinId || "default",
        color: info.color || "#3b82f6",
        headColor: info.headColor || "#2563eb",
        isBoosting: false,
        avatar: info.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${info.username}`,
        survivalStart: Date.now(),
        rank: 1
      };

      lobby.players.set(socket.id, newPlayer);

      // Welcome message history packet
      socket.emit("join_success", {
        playerId: socket.id,
        mapSize: MAP_SIZE,
        chatHistory: lobby.chatHistory
      });

      // System notification inside lobby chat
      const chatItem = {
        username: "System 🤖",
        text: `⚔️ Gladiator ${newPlayer.username} entered the battle field!`,
        time: Date.now(),
        type: 'global' as const
      };
      lobby.chatHistory.push(chatItem);
      if (lobby.chatHistory.length > 25) lobby.chatHistory.shift();
      io.to(currentRoomId).emit("chat_broadcast", chatItem);
    });

    // Input steering synchronizer from the client frames
    socket.on("update_input", (input: { angle: number; isBoosting: boolean }) => {
      const lobby = lobbies.get(currentRoomId);
      if (!lobby) return;

      const player = lobby.players.get(socket.id);
      if (!player) return;

      player.angle = input.angle;
      player.isBoosting = input.isBoosting;
    });

    // Floating Emoji synchronizations
    socket.on("send_emoji", (emoji: string) => {
      const lobby = lobbies.get(currentRoomId);
      if (!lobby) return;

      const player = lobby.players.get(socket.id);
      if (!player) return;

      io.to(currentRoomId).emit("emoji_broadcast", {
        playerId: socket.id,
        emoji,
        x: player.segments[0]?.x || 0,
        y: (player.segments[0]?.y || 0) - 40
      });
    });

    // In-game live chatting channels
    socket.on("send_chat", (payload: { text: string; type: 'global' | 'team' }) => {
      const lobby = lobbies.get(currentRoomId);
      if (!lobby) return;

      const player = lobby.players.get(socket.id);
      if (!player) return;

      const chatItem = {
        username: player.username,
        text: payload.text.slice(0, 100), // Max 100 char clip safety
        time: Date.now(),
        type: payload.type
      };

      lobby.chatHistory.push(chatItem);
      if (lobby.chatHistory.length > 25) lobby.chatHistory.shift();

      io.to(currentRoomId).emit("chat_broadcast", chatItem);
    });

    // Handle user disconnecting
    socket.on("disconnect", () => {
      const lobby = lobbies.get(currentRoomId);
      if (!lobby) return;

      const player = lobby.players.get(socket.id);
      if (player) {
        // Disperse segments as edible food on client log-offs
        player.segments.forEach((seg, index) => {
          if (index % 3 === 0) {
            lobby.pellets.push({
              id: "trail_leave_" + Math.random().toString(36).substring(2, 9),
              x: seg.x + (Math.random() * 16 - 8),
              y: seg.y + (Math.random() * 16 - 8),
              size: 6,
              color: player.color,
              type: 'normal',
              points: 5
            });
          }
        });

        lobby.players.delete(socket.id);

        const chatItem = {
          username: "System 🤖",
          text: `🚩 ${player.username} retreated from the battle front.`,
          time: Date.now(),
          type: 'global' as const
        };
        lobby.chatHistory.push(chatItem);
        io.to(currentRoomId).emit("chat_broadcast", chatItem);
      }
    });
  });
}
