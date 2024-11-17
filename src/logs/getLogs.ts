import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { ApiError } from "../functions/apiError";
import fs from "fs";
import path from "path";

// Define the path to the log file at the root of the project
const REST_PATH = path.join(__dirname, "..", "..", "logs", "error.json");
const SOCKET_PATH = path.join(
  __dirname,
  "..",
  "..",
  "logs",
  "socketError.json"
);

export async function getLogs(
  req: CustomRequest,
  res: Response
): Promise<Response> {
  const key = req.query.key;
  const type = req.query.type;
  if (!key || key !== process.env.LOGS_KEY) {
    throw new ApiError("Fuck u got it ", 400);
  }

  const logFilePath = type === "s" ? SOCKET_PATH : REST_PATH;

  if (!fs.existsSync(logFilePath)) {
    throw new ApiError("Log file not found", 404);
  }

  const logContent = fs.readFileSync(logFilePath, { encoding: "utf8" });

  try {
    const wrappedContent = `[${logContent.replace(/}\s*{/g, "},{")}]`;
    const logs = JSON.parse(wrappedContent);
    const formattedLogs = JSON.stringify(logs, null, 2);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Transfer-Encoding", "chunked");

    return res.send(formattedLogs);
  } catch (error) {
    console.log(error);

    // If there is an error while parsing or formatting the logs
    throw new ApiError("Error processing log file", 500);
  }
}
