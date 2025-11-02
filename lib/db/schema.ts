import { pgTable, serial, integer, varchar, timestamp, uuid, decimal, unique, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  gameCode: varchar("game_code", { length: 5 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  gameCodeIdx: index("game_code_idx").on(table.gameCode),
}));

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => ({
  tokenIdx: index("token_idx").on(table.token),
}));

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
  name: varchar("name", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  gameIdIdx: index("player_game_id_idx").on(table.gameId),
  sessionIdIdx: index("player_session_id_idx").on(table.sessionId),
}));

export const buyIns = pgTable("buy_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  playerIdIdx: index("buy_in_player_id_idx").on(table.playerId),
}));

export const finals = pgTable("finals", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }).unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  playerIdIdx: index("final_player_id_idx").on(table.playerId),
}));

// Relations
export const gamesRelations = relations(games, ({ many }) => ({
  players: many(players),
}));

export const sessionsRelations = relations(sessions, ({ many }) => ({
  players: many(players),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  game: one(games, {
    fields: [players.gameId],
    references: [games.id],
  }),
  session: one(sessions, {
    fields: [players.sessionId],
    references: [sessions.id],
  }),
  buyIns: many(buyIns),
  final: one(finals),
}));

export const buyInsRelations = relations(buyIns, ({ one }) => ({
  player: one(players, {
    fields: [buyIns.playerId],
    references: [players.id],
  }),
}));

export const finalsRelations = relations(finals, ({ one }) => ({
  player: one(players, {
    fields: [finals.playerId],
    references: [players.id],
  }),
}));

