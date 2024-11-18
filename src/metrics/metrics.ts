import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from "prom-client";
export const register = new Registry();

collectDefaultMetrics({ register });
export const httpRequestDurationHistogram = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 1.5, 10],
});
register.registerMetric(httpRequestDurationHistogram);
export const httpRequestErrorCounter = new Counter({
  name: "http_request_errors_total",
  help: "Total number of HTTP request errors",
  labelNames: ["method", "route", "status_code", "error_message"],
});
register.registerMetric(httpRequestErrorCounter);
export const socketIoErrorCounter = new Counter({
  name: "socket_io_errors_total",
  help: "Total number of Socket.IO errors",
  labelNames: ["event", "error_message"],
});

register.registerMetric(socketIoErrorCounter);
