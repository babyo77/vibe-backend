import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import ytmusic from "../lib/ytMusic";
import { encrypt } from "../lib/lock";
import { VibeCache } from "../cache/cache";
import { getInnertubeInstance } from "../lib/utils";

export const search = async (req: CustomRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 0;
    const search = String(req.query.name || "").trim();

    if (!search) throw new Error("Search not found");
    if (VibeCache.has(`${page + search}`)) {
      return res.json({
        data: VibeCache.get(`${page + search}`),
      });
    }

    // Initialize yt only if search is a URL
    let yt = null;
    if (search.startsWith("http")) {
      yt = await getInnertubeInstance();
    }
    // Fetch data concurrently
    const [data, ytSongs, yt2Songs] = await Promise.all([
      !search.startsWith("http")
        ? fetch(
            `${
              process.env.BACKEND_URI
            }/api/search/songs?query=${encodeURIComponent(
              search
            )}&page=${page}&limit=4`
          ).then((res) => res.json())
        : null,
      page === 0 && !search.startsWith("http")
        ? ytmusic.searchSongs(search)
        : null,
      yt ? yt.search(search) : null,
    ]);

    const result = data || {
      data: {
        total: 0,
        start: 0,
        results: [],
      },
    };

    const songs =
      ytSongs?.map((s: any) => ({
        id: s.videoId,
        name: s.name,
        artists: {
          primary: [
            {
              name: s.artist.name,
            },
          ],
        },
        image: [
          {
            quality: "500x500",
            url: `https://wsrv.nl/?url=${s.thumbnails[
              s.thumbnails.length - 1
            ].url
              .replace(/w\\d+-h\\d+/, "w500-h500")
              .replace("w120-h120", "w500-h500")}`,
          },
        ],
        source: "youtube",
        downloadUrl: [
          {
            quality: "320kbps",
            url: `${encrypt(s.videoId)}`,
          },
        ],
      })) || [];

    const songs2 =
      yt2Songs?.results
        .filter((result: any) => result.type === "Video")
        .slice(0, 1)
        .map((s: any) => ({
          id: s.id,
          name: s.title.text,
          artists: {
            primary: [
              {
                name: s.author.name,
              },
            ],
          },
          video: true,
          image: [
            {
              quality: "500x500",
              url: `https://wsrv.nl/?url=${s.thumbnails[
                s.thumbnails.length - 1
              ].url
                .replace(/w\\d+-h\\d+/, "w500-h500")
                .replace("w120-h120", "w500-h500")}`,
            },
          ],
          source: "youtube",
          downloadUrl: [
            {
              quality: "320kbps",
              url: `${encrypt(s.id)}`,
            },
          ],
        })) || [];

    const payload = {
      ...result.data,
      results: [...result.data.results.slice(0, 4), ...songs2, ...songs],
    };
    VibeCache.set(`${page + search}`, payload);
    return res.json({
      data: payload,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Failed to fetch", error: error.message });
  }
};
