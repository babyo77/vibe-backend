import { encrypt } from "tanmayo7lock";
import { CustomRequest } from "../middleware/auth";
import { Response } from "express";
import { VibeCache } from "../cache/cache";
import ytpl from "ytpl";
import { ApiError } from "./apiError";
export async function getPlaylist(
  req: CustomRequest,
  res: Response
): Promise<Response> {
  const id = req.params.id;

  if (!id || typeof id !== "string") throw new ApiError("Invalid song ID");
  if (VibeCache.has(id)) {
    return res.json(VibeCache.get(id));
  }

  const playlist = await ytpl(id, {
    pages: Infinity,
    requestOptions: { headers: { Cookie: process.env.COOKIES || "" } },
  });
  if (!playlist.items) throw new ApiError("Unable to get playlist");
  const tracks = playlist.items.map((s) => ({
    id: s.id,
    name: s.title,
    artists: {
      primary: [
        {
          name: s.author.name,
        },
      ],
    },
    video: !s.bestThumbnail?.url?.includes("i.ytimg.com") ? true : false,
    image: [
      {
        quality: "500x500",
        url: `https://wsrv.nl/?url=${s.thumbnails[
          s.thumbnails.length - 1
        ].url?.replace("hqdefault", "maxresdefault")}`,
      },
    ],
    source: "youtube",
    downloadUrl: [
      {
        quality: "320kbps",
        url: `${encrypt(s.id)}`,
      },
    ],
  }));
  VibeCache.set(id, tracks);
  return res.json(tracks);
}
