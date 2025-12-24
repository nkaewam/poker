import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  uuid,
  decimal,
  unique,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const games = pgTable(
  "games",
  {
    id: serial("id").primaryKey(),
    gameCode: varchar("game_code", { length: 5 }).notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    gameCodeIdx: index("game_code_idx").on(table.gameCode),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => ({
    tokenIdx: index("token_idx").on(table.token),
  })
);

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    gameIdIdx: index("player_game_id_idx").on(table.gameId),
    sessionIdIdx: index("player_session_id_idx").on(table.sessionId),
  })
);

export const buyIns = pgTable(
  "buy_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    playerIdIdx: index("buy_in_player_id_idx").on(table.playerId),
  })
);

export const finals = pgTable(
  "finals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" })
      .unique(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    playerIdIdx: index("final_player_id_idx").on(table.playerId),
  })
);

export const gameLogs = pgTable(
  "game_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 50 }).notNull(),
    playerId: uuid("player_id").references(() => players.id, {
      onDelete: "set null",
    }),
    actorSessionId: uuid("actor_session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    actorPlayerId: uuid("actor_player_id").references(() => players.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    gameIdIdx: index("game_log_game_id_idx").on(table.gameId),
    createdAtIdx: index("game_log_created_at_idx").on(table.createdAt),
  })
);

// Relations
export const gamesRelations = relations(games, ({ many }) => ({
  players: many(players),
  logs: many(gameLogs),
}));

export const sessionsRelations = relations(sessions, ({ many }) => ({
  players: many(players),
  actorLogs: many(gameLogs),
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
  affectedLogs: many(gameLogs, { relationName: "affectedPlayer" }),
  actorLogs: many(gameLogs, { relationName: "actorPlayer" }),
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

export const gameLogsRelations = relations(gameLogs, ({ one }) => ({
  game: one(games, {
    fields: [gameLogs.gameId],
    references: [games.id],
  }),
  player: one(players, {
    fields: [gameLogs.playerId],
    references: [players.id],
    relationName: "affectedPlayer",
  }),
  actorSession: one(sessions, {
    fields: [gameLogs.actorSessionId],
    references: [sessions.id],
  }),
  actorPlayer: one(players, {
    fields: [gameLogs.actorPlayerId],
    references: [players.id],
    relationName: "actorPlayer",
  }),
}));
