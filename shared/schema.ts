import { pgTable, text, serial, boolean, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gameStatusEnum = ["LOBBY", "IN_PROGRESS", "FREE_ROUND", "SHOW_RESULTS", "COMPLETED"] as const;

export const games = pgTable("games", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomCode: varchar("room_code", { length: 6 }).notNull().unique(),
  status: text("status", { enum: gameStatusEnum }).notNull().default("LOBBY"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  hostId: text("host_id").notNull(),
  theme: text("theme"),
  currentRoundId: text("current_round_id").unique(),
});

export const players = pgTable("players", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  isHost: boolean("is_host").notNull().default(false),
  gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
});

export const prompts = pgTable("prompts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  text: text("text").notNull(),
  gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  used: boolean("used").notNull().default(false),
});

export const rounds = pgTable("rounds", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  promptId: text("prompt_id").notNull().references(() => prompts.id),
  gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  isFreeRound: boolean("is_free_round").notNull().default(false),
  completed: boolean("completed").notNull().default(false),
  roundNumber: integer("round_number").notNull(),
});

export const situations = pgTable("situations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull(),
  number: integer("number").notNull(),
  position: integer("position").notNull(),
  playerId: text("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  roundId: text("round_id").notNull().references(() => rounds.id, { onDelete: "cascade" }),
});

// Relations
export const gamesRelations = relations(games, ({ many, one }) => ({
  players: many(players),
  prompts: many(prompts),
  rounds: many(rounds),
  currentRound: one(rounds, {
    fields: [games.currentRoundId],
    references: [rounds.id],
  }),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  game: one(games, {
    fields: [players.gameId],
    references: [games.id],
  }),
  situations: many(situations),
}));

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  game: one(games, {
    fields: [prompts.gameId],
    references: [games.id],
  }),
  rounds: many(rounds),
}));

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  prompt: one(prompts, {
    fields: [rounds.promptId],
    references: [prompts.id],
  }),
  game: one(games, {
    fields: [rounds.gameId],
    references: [games.id],
  }),
  situations: many(situations),
}));

export const situationsRelations = relations(situations, ({ one }) => ({
  player: one(players, {
    fields: [situations.playerId],
    references: [players.id],
  }),
  round: one(rounds, {
    fields: [situations.roundId],
    references: [rounds.id],
  }),
}));

// Insert schemas
export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
});

export const insertPromptSchema = createInsertSchema(prompts).omit({
  id: true,
});

export const insertRoundSchema = createInsertSchema(rounds).omit({
  id: true,
});

export const insertSituationSchema = createInsertSchema(situations).omit({
  id: true,
});

// Types
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof prompts.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Round = typeof rounds.$inferSelect;
export type InsertSituation = z.infer<typeof insertSituationSchema>;
export type Situation = typeof situations.$inferSelect;

export type GameStatus = typeof gameStatusEnum[number];
