import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";

// Generate room code
function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate random number between 0-100
function generateRandomNumber(): number {
  return Math.floor(Math.random() * 101);
}

// Predefined themes with prompts
const themePrompts = {
  "life-events": [
    "Getting your first job",
    "Moving to a new city", 
    "Getting married",
    "Having your first child",
    "Retiring from work"
  ],
  "historical-events": [
    "The invention of the wheel",
    "The fall of the Roman Empire",
    "The discovery of America",
    "World War II",
    "The moon landing"
  ],
  "daily-activities": [
    "Waking up in the morning",
    "Eating breakfast",
    "Commuting to work",
    "Having lunch",
    "Going to bed"
  ]
};

// WebSocket clients storage
const wsClients = new Map<string, WebSocket[]>();

// Broadcast to all clients in a room
function broadcastToRoom(roomCode: string, event: string, data: any) {
  const clients = wsClients.get(roomCode) || [];
  const message = JSON.stringify({ event, data });
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const roomCode = url.searchParams.get('roomCode');
    
    if (roomCode) {
      if (!wsClients.has(roomCode)) {
        wsClients.set(roomCode, []);
      }
      wsClients.get(roomCode)!.push(ws);

      ws.on('message', (message) => {
        try {
          const { event, data } = JSON.parse(message.toString());
          
          // Broadcast real-time events to all clients in room
          switch (event) {
            case 'mouse:move':
            case 'drag:move':
            case 'click:event':
              broadcastToRoom(roomCode, `${event}:update`, data);
              break;
            case 'game:tick':
              broadcastToRoom(roomCode, 'game:tick', data);
              break;
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        const clients = wsClients.get(roomCode) || [];
        const index = clients.indexOf(ws);
        if (index > -1) {
          clients.splice(index, 1);
        }
      });
    }
  });

  // Create game
  app.post('/api/games', async (req, res) => {
    try {
      const createGameSchema = z.object({
        hostName: z.string().min(1).max(50),
      });

      const { hostName } = createGameSchema.parse(req.body);
      const roomCode = generateRoomCode();

      // Create game
      const game = await storage.createGame({
        roomCode,
        status: "LOBBY",
        hostId: "",
        theme: null,
      });

      // Create host player
      const host = await storage.createPlayer({
        name: hostName,
        color: "#6366F1",
        isHost: true,
        gameId: game.id,
      });

      // Update game with host ID
      await storage.updateGameCurrentRound(game.id, null);

      res.json({ game, host });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Join game
  app.post('/api/games/:roomCode/join', async (req, res) => {
    try {
      const joinGameSchema = z.object({
        playerName: z.string().min(1).max(50),
      });

      const { roomCode } = req.params;
      const { playerName } = joinGameSchema.parse(req.body);

      const game = await storage.getGameByRoomCode(roomCode);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.status !== "LOBBY") {
        return res.status(400).json({ message: "Game has already started" });
      }

      // Check if player limit reached
      const existingPlayers = await storage.getPlayersByGameId(game.id);
      if (existingPlayers.length >= 8) {
        return res.status(400).json({ message: "Game is full" });
      }

      // Generate random color
      const colors = ["#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];
      const usedColors = existingPlayers.map(p => p.color);
      const availableColors = colors.filter(c => !usedColors.includes(c));
      const playerColor = availableColors[0] || colors[Math.floor(Math.random() * colors.length)];

      const player = await storage.createPlayer({
        name: playerName,
        color: playerColor,
        isHost: false,
        gameId: game.id,
      });

      // Broadcast player joined
      broadcastToRoom(roomCode, 'player:joined', { player });

      res.json({ game, player });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Get game state
  app.get('/api/games/:roomCode', async (req, res) => {
    try {
      const { roomCode } = req.params;
      
      const game = await storage.getGameByRoomCode(roomCode);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const players = await storage.getPlayersByGameId(game.id);
      const prompts = await storage.getPromptsByGameId(game.id);
      const rounds = await storage.getRoundsByGameId(game.id);

      let currentRound = null;
      let situations: any[] = [];

      if (game.currentRoundId) {
        currentRound = await storage.getRound(game.currentRoundId);
        if (currentRound) {
          situations = await storage.getSituationsWithPlayerData(currentRound.id);
        }
      }

      res.json({
        game,
        players,
        prompts,
        rounds,
        currentRound,
        situations,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get game state" });
    }
  });

  // Update game setup (theme, prompts)
  app.put('/api/games/:roomCode/setup', async (req, res) => {
    try {
      const setupSchema = z.object({
        theme: z.string().optional(),
        customPrompts: z.array(z.string()).optional(),
      });

      const { roomCode } = req.params;
      const { theme, customPrompts } = setupSchema.parse(req.body);

      const game = await storage.getGameByRoomCode(roomCode);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Create prompts based on theme or custom input
      let promptTexts: string[] = [];
      if (theme && themePrompts[theme as keyof typeof themePrompts]) {
        promptTexts = themePrompts[theme as keyof typeof themePrompts];
      } else if (customPrompts) {
        promptTexts = customPrompts;
      }

      if (promptTexts.length > 0) {
        await storage.createPrompts(
          promptTexts.map(text => ({
            text,
            gameId: game.id,
            used: false,
          }))
        );
      }

      broadcastToRoom(roomCode, 'game:setup_updated', { theme, promptTexts });

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Start game
  app.post('/api/games/:roomCode/start', async (req, res) => {
    try {
      const { roomCode } = req.params;
      
      const game = await storage.getGameByRoomCode(roomCode);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const players = await storage.getPlayersByGameId(game.id);
      const unusedPrompts = await storage.getUnusedPrompts(game.id);

      if (players.length < 2) {
        return res.status(400).json({ message: "Need at least 2 players to start" });
      }

      if (unusedPrompts.length === 0) {
        return res.status(400).json({ message: "No prompts available" });
      }

      // Create first round
      const firstPrompt = unusedPrompts[0];
      const round = await storage.createRound({
        promptId: firstPrompt.id,
        gameId: game.id,
        isFreeRound: false,
        completed: false,
        roundNumber: 1,
      });

      await storage.markPromptAsUsed(firstPrompt.id);
      await storage.updateGameStatus(game.id, "IN_PROGRESS");
      await storage.updateGameCurrentRound(game.id, round.id);

      broadcastToRoom(roomCode, 'game:started', { round, prompt: firstPrompt });

      res.json({ round, prompt: firstPrompt });
    } catch (error) {
      res.status(500).json({ message: "Failed to start game" });
    }
  });

  // Submit situation
  app.post('/api/games/:roomCode/situations', async (req, res) => {
    try {
      const situationSchema = z.object({
        content: z.string().min(1).max(200),
        position: z.number().min(0).max(100),
        playerId: z.string(),
      });

      const { roomCode } = req.params;
      const { content, position, playerId } = situationSchema.parse(req.body);

      const game = await storage.getGameByRoomCode(roomCode);
      if (!game || !game.currentRoundId) {
        return res.status(404).json({ message: "Game or round not found" });
      }

      const situation = await storage.createSituation({
        content,
        number: generateRandomNumber(),
        position,
        playerId,
        roundId: game.currentRoundId,
      });

      const player = await storage.getPlayer(playerId);

      broadcastToRoom(roomCode, 'situation:created', { 
        situation: { ...situation, player } 
      });

      res.json({ situation });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Update situation position
  app.put('/api/situations/:id/position', async (req, res) => {
    try {
      const positionSchema = z.object({
        position: z.number().min(0).max(100),
        roomCode: z.string(),
      });

      const { id } = req.params;
      const { position, roomCode } = positionSchema.parse(req.body);

      await storage.updateSituationPosition(id, position);

      broadcastToRoom(roomCode, 'situation:moved', { 
        situationId: id, 
        position 
      });

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Start free round
  app.post('/api/games/:roomCode/free-round', async (req, res) => {
    try {
      const { roomCode } = req.params;
      
      const game = await storage.getGameByRoomCode(roomCode);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      await storage.updateGameStatus(game.id, "FREE_ROUND");

      broadcastToRoom(roomCode, 'free_round:started', {});

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to start free round" });
    }
  });

  // Show results
  app.post('/api/games/:roomCode/results', async (req, res) => {
    try {
      const { roomCode } = req.params;
      
      const game = await storage.getGameByRoomCode(roomCode);
      if (!game || !game.currentRoundId) {
        return res.status(404).json({ message: "Game or round not found" });
      }

      const situations = await storage.getSituationsWithPlayerData(game.currentRoundId);
      
      // Sort by player positions and actual numbers
      const playerOrder = [...situations].sort((a, b) => a.position - b.position);
      const actualOrder = [...situations].sort((a, b) => a.number - b.number);

      await storage.updateGameStatus(game.id, "SHOW_RESULTS");
      await storage.updateRoundCompleted(game.currentRoundId, true);

      const results = {
        playerOrder,
        actualOrder,
        accuracy: calculateAccuracy(playerOrder, actualOrder),
      };

      broadcastToRoom(roomCode, 'results:ready', results);

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to show results" });
    }
  });

  // Start next round
  app.post('/api/games/:roomCode/next-round', async (req, res) => {
    try {
      const { roomCode } = req.params;
      
      const game = await storage.getGameByRoomCode(roomCode);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const unusedPrompts = await storage.getUnusedPrompts(game.id);
      const rounds = await storage.getRoundsByGameId(game.id);

      if (unusedPrompts.length === 0) {
        await storage.updateGameStatus(game.id, "COMPLETED");
        broadcastToRoom(roomCode, 'game:completed', {});
        return res.json({ completed: true });
      }

      // Create next round
      const nextPrompt = unusedPrompts[0];
      const nextRound = await storage.createRound({
        promptId: nextPrompt.id,
        gameId: game.id,
        isFreeRound: false,
        completed: false,
        roundNumber: rounds.length + 1,
      });

      await storage.markPromptAsUsed(nextPrompt.id);
      await storage.updateGameStatus(game.id, "IN_PROGRESS");
      await storage.updateGameCurrentRound(game.id, nextRound.id);

      broadcastToRoom(roomCode, 'next_round:started', { 
        round: nextRound, 
        prompt: nextPrompt 
      });

      res.json({ round: nextRound, prompt: nextPrompt });
    } catch (error) {
      res.status(500).json({ message: "Failed to start next round" });
    }
  });

  return httpServer;
}

function calculateAccuracy(playerOrder: any[], actualOrder: any[]): number {
  let correctPositions = 0;
  
  for (let i = 0; i < playerOrder.length; i++) {
    if (playerOrder[i].id === actualOrder[i].id) {
      correctPositions++;
    }
  }
  
  return Math.round((correctPositions / playerOrder.length) * 100);
}
