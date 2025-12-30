import { SecondaryStorage } from "better-auth";
import Redis from "ioredis";

const createRedisClient = (keyPrefix: string) => {
  return new Redis({
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    port: parseInt(process.env.REDIS_PORT!),
    keyPrefix,
  }).on("error", (err) => {
    console.error("Redis connection error:", err);
    throw new Error("Redis connection error");
  });
};

export const appCache = createRedisClient("poker:app:");

export const authCache = createRedisClient("poker:auth:");

export const authSecondaryStorage: SecondaryStorage = {
  get: async (key: string) => {
    const value = await authCache.get(key);
    return value ? value : null;
  },
  set: async (key: string, value: string, ttl?: number) => {
    if (ttl) {
      await authCache.set(key, value, "EX", ttl);
    } else {
      await authCache.set(key, value);
    }
  },
  delete: async (key: string) => {
    await authCache.del(key);
  },
};
