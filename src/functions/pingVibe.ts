import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { upstashClient as redisClient } from "../cache/redis";

export async function pingVibe(
  req: CustomRequest,
  res: Response
): Promise<Response> {
  const url = req.query.url;
  if (typeof url === "string" && url) {
    if (url.startsWith("https://")) {
      await redisClient.rpush("tempUploadFileInChat", url);
    }
  }
  return res.status(204).send();
}
