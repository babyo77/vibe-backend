import { Response, NextFunction } from "express";
import { getRandomEmoji } from "../lib/utils";
import { CustomRequest } from "../middleware/auth";
import { MongooseError } from "mongoose";
import { httpRequestErrorCounter } from "../metrics/metrics";

export const errorHandler = (
  err: any,
  req: CustomRequest,
  res: Response,
  _next: NextFunction
): void => {
  const { method, route } = req;
  const errorMessage = err.message || "Unknown error";

  const statusCode = err.statusCode || 500;
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

  let message = err.message || "Internal Server Error";
  console.log(err);

  if (err instanceof MongooseError) {
    // Handle MongoDB-specific errors
    if (process.env.NODE_ENV === "production") {
      message = "Fuck 😭, An unexpected error occurred";
    } else {
      message = `MongoDB Error: ${err.message}`;
    }
  }
  httpRequestErrorCounter.inc({
    method,
    route: route?.path || "unknown",
    status_code: statusCode || 500,
    error_message: errorMessage,
  });

  const finalMessage = `${message} ${randomEmoji}`;
  res.status(statusCode).json({
    success: false,
    message: finalMessage,
  });
};

export class ApiError extends Error {
  statusCode: number;

  constructor(
    message: string = "Something went wrong",
    statusCode: number = 500
  ) {
    super(message);
    this.statusCode = statusCode;

    // Maintain proper stack trace (only in development mode)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
