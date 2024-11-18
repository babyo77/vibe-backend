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
import { collectDefaultMetrics, register } from "prom-client";
import { setSocketListeners } from "./register/sockets";
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: cors,
  httpCompression: true,
});
app.use(
  useCors({
    origin: true,
    credentials: true,
  })
);
collectDefaultMetrics({ register });
app.get("/metrics", async (req, res) => {
  const key = req.query.key;
  if (!key || key !== process.env.LOGS_KEY) return res.status(403).send();
  res.setHeader("content-type", register.contentType);
  res.send(await register.metrics());
});
app.use(limiter);
app.use(express.json());
app.use(cookieParser());
app.use(router);
app.use(errorHandler);

io.use(async (socket: CustomSocket, next) => {
  try {
    socket.compress(true);
    await middleware(socket, next);
  } catch (error: any) {
    next(new Error(error.message));
  }
});

setSocketListeners(io);

runServer(server);
