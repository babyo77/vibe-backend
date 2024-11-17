import { Response } from "express";
import { getRandomEmoji } from "../lib/utils";

type StatusCode = 400 | 401 | 403 | 404 | 500 | 502 | 503 | 504;

export function apiError(
  res: Response,
  message?: string,
  status: StatusCode = 500
): void {
  const emojiArray = [
    "😂",
    "😎",
    "😭",
    "🥺",
    "💀",
    "🤡",
    "🤪",
    "🥴",
    "😜",
    "🫠",
  ];

  const randomEmoji = getRandomEmoji(emojiArray);

  const finalMessage = message || "An unexpected error occurred";

  res.status(status).json({ message: `${finalMessage} ${randomEmoji}` });
}
