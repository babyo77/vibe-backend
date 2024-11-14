import NodeCache from "node-cache";

export const VibeCache = new NodeCache({
  stdTTL: 172800,
});
export const tempCache = new NodeCache({
  stdTTL: 2,
});
