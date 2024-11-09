import NodeCache from "node-cache";

export const VibeCache = new NodeCache({
  stdTTL: 172800,
});
export const queCache = new NodeCache({
  stdTTL: 60,
});
