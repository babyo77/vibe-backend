import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { runServer } from "./lib/db";
import { CustomSocket } from "../types";
import { middleware } from "./handlers/middleware";
import { cors, limiter } from "./lib/utils";
import cookieParser from "cookie-parser";
import useCors from "cors";
import router from "./router/router";
import { errorHandler } from "./functions/apiError";
import { setSocketListeners } from "./register/sockets";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-streams-adapter";

const redisClient = createClient({
  url: process.env.REDIS_CONNECTION_URI,
});

const app = express();
const server = createServer(app);

app.use(useCors(cors));

// app.get("/metrics", async (req, res) => {
//   // const key = req.query.key;
//   // if (!key || key !== process.env.LOGS_KEY) return res.status(403).send();
//   res.setHeader("content-type", register.contentType);
//   res.send(await register.metrics());
// });
// app.use((req, res, next) => {
//   const end = httpRequestDurationHistogram.startTimer();

//   res.on("finish", () => {
//     const { method, route, statusCode } = req;
//     end({ method, route: route?.path || "unknown", status_code: statusCode });
//   });

//   next();
// });
app.use(limiter);
app.use(express.json());
app.use(cookieParser());
app.use(router);
app.use(errorHandler);

redisClient.connect().then(() => {
  const io = new Server(server, {
    cors: cors,
    adapter: createAdapter(redisClient),
  });
  io.use(async (socket: CustomSocket, next) => {
    try {
      socket.compress(true);
      await middleware(socket, next);
    } catch (error: any) {
      next(new Error(error.message));
    }
  });

  setSocketListeners(io);
});

runServer(server);
