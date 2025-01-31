import NodeCache from "node-cache";

export const roomCache = new NodeCache({
  stdTTL: 172800,
});
export const tnzara = new NodeCache();
