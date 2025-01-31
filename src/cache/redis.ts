import { Redis as upstash } from "@upstash/redis";
import { configDotenv } from "dotenv";
import Redis from "node-cache";
configDotenv();

export const upstashClient = new upstash({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const redisClient = new Redis();

export default redisClient;

// export default redisClient;
