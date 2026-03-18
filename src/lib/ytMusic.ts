import YTMusic from "ytmusic-api";
const ytmusic = new YTMusic();

let initPromise: Promise<boolean> | null = null;
let initOk = false;

async function ensureInitialized(): Promise<boolean> {
  if (initOk) return true;
  if (initPromise) return initPromise;

  const cookies = process.env.COOKIES;
  if (!cookies || cookies.trim() === "") {
    initPromise = Promise.resolve(false);
    return initPromise;
  }

  initPromise = ytmusic
    .initialize({ cookies })
    .then(() => {
      initOk = true;
      return true;
    })
    .catch(() => false);

  return initPromise;
}

export async function searchSongsSafe(query: string) {
  const ok = await ensureInitialized();
  if (!ok) return null;
  try {
    return await ytmusic.searchSongs(query);
  } catch {
    return null;
  }
}

// Best-effort warmup (never block import).
void ensureInitialized();
export default ytmusic;
