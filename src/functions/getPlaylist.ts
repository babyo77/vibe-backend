import { encrypt } from "tanmayo7lock";
import { CustomRequest } from "../middleware/auth";
import { Response } from "express";
import { VibeCache } from "../cache/cache";
import { ApiError } from "./apiError";
import { getInnertubeInstance } from "../lib/utils";
export async function getPlaylist(
  req: CustomRequest,
  res: Response
): Promise<Response> {
  const id = req.query.id;
  if (!id || typeof id !== "string") throw new Error("Invalid song ID");
  if (VibeCache.has(id)) {
    return res.json(VibeCache.get(id));
  }
  const ytmusic = await getInnertubeInstance();
  const songs = await ytmusic.music.getPlaylist(id).catch(() => {
    throw new ApiError("Cant get playlist", 400);
  });
  if (!songs) throw new ApiError("Cant get playlist", 400);
  const playload = songs?.contents?.map((s, i) => ({
    id: s.id,
    name: s.name,
    artists: {
      primary: [
        {
          name: s.artists ? s.artists[0].name : "Unknown",
        },
      ],
    },
    video: !s.thumbnails
      .at(-1)
      ?.url.includes("https://lh3.googleusercontent.com")
      ? true
      : false,
    image: [
      {
        d: s.thumbnails,
        quality: "500x500",
        url: `https://wsrv.nl/?url=${s.thumbnails
          .at(-1)
          ?.url.replace(/w\\d+-h\\d+/, "w500-h500")
          .replace("w120-h120", "w500-h500")}`,
      },
    ],
    source: "youtube",
    downloadUrl: [
      {
        quality: "320kbps",
        url: `${encrypt(s?.id || "")}`,
      },
    ],
  }));
  VibeCache.set(id, playload);
  return res.json(playload);
}
