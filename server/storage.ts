import { 
  games, players, prompts, rounds, situations,
  type Game, type Player, type Prompt, type Round, type Situation,
  type InsertGame, type InsertPlayer, type InsertPrompt, type InsertRound, type InsertSituation
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Game methods
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: string): Promise<Game | undefined>;
  getGameByRoomCode(roomCode: string): Promise<Game | undefined>;
  updateGameStatus(id: string, status: string): Promise<void>;
  updateGameCurrentRound(id: string, roundId: string | null): Promise<void>;
  
  // Player methods
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayersByGameId(gameId: string): Promise<Player[]>;
  updatePlayerColor(id: string, color: string): Promise<void>;
  
  // Prompt methods
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  createPrompts(prompts: InsertPrompt[]): Promise<Prompt[]>;
  getPromptsByGameId(gameId: string): Promise<Prompt[]>;
  getUnusedPrompts(gameId: string): Promise<Prompt[]>;
  markPromptAsUsed(id: string): Promise<void>;
  
  // Round methods
  createRound(round: InsertRound): Promise<Round>;
  getRound(id: string): Promise<Round | undefined>;
  getRoundsByGameId(gameId: string): Promise<Round[]>;
  updateRoundCompleted(id: string, completed: boolean): Promise<void>;
  
  // Situation methods
  createSituation(situation: InsertSituation): Promise<Situation>;
  getSituationsByRoundId(roundId: string): Promise<Situation[]>;
  updateSituationPosition(id: string, position: number): Promise<void>;
  getSituationsWithPlayerData(roundId: string): Promise<(Situation & { player: Player })[]>;
}

export class DatabaseStorage implements IStorage {
  // Game methods
  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(insertGame).returning();
    return game;
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async getGameByRoomCode(roomCode: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.roomCode, roomCode));
    return game || undefined;
  }

  async updateGameStatus(id: string, status: string): Promise<void> {
    await db.update(games).set({ status }).where(eq(games.id, id));
  }

  async updateGameCurrentRound(id: string, roundId: string | null): Promise<void> {
    await db.update(games).set({ currentRoundId: roundId }).where(eq(games.id, id));
  }

  // Player methods
  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db.insert(players).values(insertPlayer).returning();
    return player;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async getPlayersByGameId(gameId: string): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.gameId, gameId));
  }

  async updatePlayerColor(id: string, color: string): Promise<void> {
    await db.update(players).set({ color }).where(eq(players.id, id));
  }

  // Prompt methods
  async createPrompt(insertPrompt: InsertPrompt): Promise<Prompt> {
    const [prompt] = await db.insert(prompts).values(insertPrompt).returning();
    return prompt;
  }

  async createPrompts(insertPrompts: InsertPrompt[]): Promise<Prompt[]> {
    return await db.insert(prompts).values(insertPrompts).returning();
  }

  async getPromptsByGameId(gameId: string): Promise<Prompt[]> {
    return await db.select().from(prompts).where(eq(prompts.gameId, gameId));
  }

  async getUnusedPrompts(gameId: string): Promise<Prompt[]> {
    return await db.select().from(prompts)
      .where(and(eq(prompts.gameId, gameId), eq(prompts.used, false)));
  }

  async markPromptAsUsed(id: string): Promise<void> {
    await db.update(prompts).set({ used: true }).where(eq(prompts.id, id));
  }

  // Round methods
  async createRound(insertRound: InsertRound): Promise<Round> {
    const [round] = await db.insert(rounds).values(insertRound).returning();
    return round;
  }

  async getRound(id: string): Promise<Round | undefined> {
    const [round] = await db.select().from(rounds).where(eq(rounds.id, id));
    return round || undefined;
  }

  async getRoundsByGameId(gameId: string): Promise<Round[]> {
    return await db.select().from(rounds)
      .where(eq(rounds.gameId, gameId))
      .orderBy(desc(rounds.roundNumber));
  }

  async updateRoundCompleted(id: string, completed: boolean): Promise<void> {
    await db.update(rounds).set({ completed }).where(eq(rounds.id, id));
  }

  // Situation methods
  async createSituation(insertSituation: InsertSituation): Promise<Situation> {
    const [situation] = await db.insert(situations).values(insertSituation).returning();
    return situation;
  }

  async getSituationsByRoundId(roundId: string): Promise<Situation[]> {
    return await db.select().from(situations).where(eq(situations.roundId, roundId));
  }

  async updateSituationPosition(id: string, position: number): Promise<void> {
    await db.update(situations).set({ position }).where(eq(situations.id, id));
  }

  async getSituationsWithPlayerData(roundId: string): Promise<(Situation & { player: Player })[]> {
    const result = await db.select({
      id: situations.id,
      content: situations.content,
      number: situations.number,
      position: situations.position,
      playerId: situations.playerId,
      roundId: situations.roundId,
      player: players,
    })
    .from(situations)
    .innerJoin(players, eq(situations.playerId, players.id))
    .where(eq(situations.roundId, roundId));

    return result.map(row => ({
      ...row,
      player: row.player,
    }));
  }
}

export const storage = new DatabaseStorage();
