import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { Innertube } from "youtubei.js";
import ytmusic from "../lib/ytMusic";
import { encrypt } from "../lib/lock";

export const search = async (req: CustomRequest, res: Response) => {
  try {
    // Initialize YouTube music and Innertube

    const page = Number(req.query.page) || 0;
    const search = String(req.query.name) || "";

    if (!search) throw new Error("Search not found");

    let yt = null;
    if (search.startsWith("http")) {
      yt = await Innertube.create({
        cookie: process.env.COOKIES,
      });
    }

    // Fetch data concurrently
    const [data, ytSongs, yt2Songs] = await Promise.all([
      !search.startsWith("http")
        ? fetch(
            `${
              process.env.BACKEND_URI
            }/api/search/songs?query=${encodeURIComponent(
              search
            )}&page=${page}&limit=5`,
            {
              cache: "force-cache",
            }
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
              id: s.artist.artistId,
              name: s.artist.name,
              role: "",
              image: [],
              type: "artist",
              url: "",
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
                id: s.author.id,
                name: s.author.name,
                role: "",
                image: s.author.thumbnails.map((thumb: any) => ({
                  url: thumb.url,
                })),
                type: "artist",
                url: s.author.url,
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
              url: `${encrypt(s.id)}`,
            },
          ],
        })) || [];

    return res.json({
      data: {
        ...result.data,
        results: [
          ...result.data.results.slice(0, 4),
          ...songs2,
          ...songs,
          ...result.data.results.slice(4),
        ],
      },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Failed to fetch", error: error.message });
  }
};
