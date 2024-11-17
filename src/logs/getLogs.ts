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
    throw new ApiError("Unauthorized access", 400);
  }

  const logFilePath = type === "s" ? SOCKET_PATH : REST_PATH;

  if (!fs.existsSync(logFilePath)) {
    throw new ApiError("Log file not found", 404);
  }

  const logContent = fs.readFileSync(logFilePath, { encoding: "utf8" });

  try {
    // Wrap the content as an array if it's a continuous JSON object
    const wrappedContent = `[${logContent.replace(/}\s*{/g, "},{")}]`;
    const logs = JSON.parse(wrappedContent);
    const formattedLogs = JSON.stringify(logs, null, 2);

    // Set appropriate headers
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Transfer-Encoding", "chunked");

    // Send the data in chunks
    let chunkSize = 1024; // size of each chunk in bytes (1KB)
    let position = 0;

    while (position < formattedLogs.length) {
      const chunk = formattedLogs.slice(position, position + chunkSize);
      res.write(chunk); // Write a chunk to the response
      position += chunkSize;
    }

    res.end(); // End the response after sending the chunks

    return res;
  } catch (error) {
    console.log(error);
    throw new ApiError("Error processing log file", 500);
  }
}
