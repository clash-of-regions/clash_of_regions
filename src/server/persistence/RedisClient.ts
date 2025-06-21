import { Redis } from "ioredis";

let client: Redis | null = null;

export function initRedis(url: string) {
  client = new Redis(url);
  return client;
}

export function getRedis(): Redis {
  if (!client) {
    throw new Error("Redis client not initialized");
  }
  return client;
}
