import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    const data = await redis.get<T>(key);
    return data;
  } catch (err) {
    console.error(`[redis] cacheGet failed for key ${key}:`, err);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.error(`[redis] cacheSet failed for key ${key}:`, err);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.del(key);
  } catch (err) {
    console.error(`[redis] cacheDelete failed for key ${key}:`, err);
  }
}

export async function cacheIncr(key: string, ttlSeconds?: number): Promise<number> {
  try {
    const redis = getRedis();
    if (!redis) return 0;
    const count = await redis.incr(key);
    if (ttlSeconds && count === 1) {
      await redis.expire(key, ttlSeconds);
    }
    return count;
  } catch (err) {
    console.error(`[redis] cacheIncr failed for key ${key}:`, err);
    return 0;
  }
}

export async function cacheExpire(key: string, ttlSeconds: number): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.expire(key, ttlSeconds);
  } catch (err) {
    console.error(`[redis] cacheExpire failed for key ${key}:`, err);
  }
}

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const redis = getRedis();
    if (!redis) return { allowed: true, remaining: limit };
    const key = `ratelimit:${identifier}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  } catch (err) {
    console.error(`[redis] rateLimit failed for ${identifier}:`, err);
    return { allowed: true, remaining: limit };
  }
}

export async function sessionSet(userId: string, sessionData: unknown, ttlSeconds: number = 86400): Promise<void> {
  await cacheSet(`session:${userId}`, sessionData, ttlSeconds);
}

export async function sessionGet<T>(userId: string): Promise<T | null> {
  return cacheGet<T>(`session:${userId}`);
}

export async function sessionDelete(userId: string): Promise<void> {
  await cacheDelete(`session:${userId}`);
}

export function buildCacheKey(...parts: string[]): string {
  return parts.join(":");
}
