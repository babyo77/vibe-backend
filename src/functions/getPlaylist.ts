import { encrypt } from "tanmayo7lock";
import { CustomRequest } from "../middleware/auth";
import { Response } from "express";
import { VibeCache } from "../cache/cache";
import ytmusic from "../lib/ytMusic";
import { apiError } from "./apiError";
export async function getPlaylist(req: CustomRequest, res: Response) {
  const id = req.query.id;

  try {
    if (!id || typeof id !== "string") throw new Error("Invalid song ID");
    if (VibeCache.has(id)) {
      return res.json(VibeCache.get(id));
    }

    const songs = await ytmusic.getPlaylistVideos(id);

    const playload = songs?.map((s, i) => ({
      id: s.videoId,
      name: s.name,
      artists: {
        primary: [
          {
            name: s.artist.name || "Unknown",
          },
        ],
      },
      video: true,
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
          url: `${encrypt(s?.videoId)}`,
        },
      ],
    }));
    VibeCache.set(id, playload);
    return res.json(playload);
  } catch (error: any) {
    console.log(error);
    return apiError(res, "Failed to fetch");
  }
}
