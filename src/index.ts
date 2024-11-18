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
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from "prom-client";
import { setSocketListeners } from "./register/sockets";
const app = express();
const server = createServer(app);
const register = new Registry();
collectDefaultMetrics({ register });
const httpRequestDurationHistogram = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 1.5, 10],
});
register.registerMetric(httpRequestDurationHistogram);
const httpRequestErrorCounter = new Counter({
  name: "http_request_errors_total",
  help: "Total number of HTTP request errors",
  labelNames: ["method", "route", "status_code", "error_message"],
});
register.registerMetric(httpRequestErrorCounter);

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
app.use((req, res, next) => {
  const end = httpRequestDurationHistogram.startTimer();

  res.on("finish", () => {
    const { method, route, statusCode } = req;
    end({ method, route: route?.path || "unknown", status_code: statusCode });
  });

  next();
});
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
