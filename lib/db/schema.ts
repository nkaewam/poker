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
  boolean,
  text,
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

// Better-auth generated tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  nickname: varchar("nickname", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => session.id, {
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
    actorSessionId: text("actor_session_id").references(() => session.id, {
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
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one, many }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
  players: many(players),
  actorLogs: many(gameLogs),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  players: many(players),
  logs: many(gameLogs),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  game: one(games, {
    fields: [players.gameId],
    references: [games.id],
  }),
  session: one(session, {
    fields: [players.sessionId],
    references: [session.id],
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
  actorSession: one(session, {
    fields: [gameLogs.actorSessionId],
    references: [session.id],
  }),
  actorPlayer: one(players, {
    fields: [gameLogs.actorPlayerId],
    references: [players.id],
    relationName: "actorPlayer",
  }),
}));
