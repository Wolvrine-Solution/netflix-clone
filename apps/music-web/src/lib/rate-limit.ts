import { redis } from "./redis";

const PER_MINUTE = parseInt(process.env.RATE_LIMIT_PER_MINUTE ?? "10");
const PER_DAY = parseInt(process.env.RATE_LIMIT_PER_DAY ?? "50");

export async function rateLimit(ip: string): Promise<boolean> {
  const minuteKey = `rl:${ip}:min:${Math.floor(Date.now() / 60000)}`;
  const dayKey = `rl:${ip}:day:${new Date().toISOString().slice(0, 10)}`;

  const [minuteCount, dayCount] = await Promise.all([
    redis.incr(minuteKey),
    redis.incr(dayKey),
  ]);

  if (minuteCount === 1) await redis.expire(minuteKey, 60);
  if (dayCount === 1) await redis.expire(dayKey, 86400);

  return minuteCount > PER_MINUTE || dayCount > PER_DAY;
}
