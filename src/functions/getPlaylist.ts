import { encrypt } from "tanmayo7lock";
import ytpl from "ytpl";
import { CustomRequest } from "../middleware/auth";
import { Response } from "express";
import { VibeCache } from "../cache/cache";
export async function getPlaylist(req: CustomRequest, res: Response) {
  const id = req.query.id;

  if (!id || typeof id !== "string") throw new Error("Invalid song ID");
  if (VibeCache.has(id)) {
    return res.json(VibeCache.get(id));
  }
  try {
    const playlist = await ytpl(id, {
      pages: Infinity,
      requestOptions: { headers: { Cookie: process.env.COOKIES || "" } },
    });
    if (!playlist.items) throw new Error("Invalid playlist");
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
      image: [
        {
          quality: "500x500",
          url: `https://wsrv.nl/?url=${s.thumbnails[
            s.thumbnails.length - 1
          ].url?.replace(/w\d+-h\d+/, "w500-h500")}`,
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
  } catch (error: any) {
    console.log(error?.message);
    return res
      .status(500)
      .json({ message: "Failed to fetch", error: error.message });
  }
}
