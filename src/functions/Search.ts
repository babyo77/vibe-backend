import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import ytmusic from "../lib/ytMusic";
import { encrypt } from "../lib/lock";
import { getInnertubeInstance } from "../lib/utils";
import { ApiError } from "./apiError";
import redisClient from "../cache/redis";

export const search = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const page = Number(req.query.page) || 0;
  const search = String(req.query.name || "").trim();

  if (!search) throw new ApiError("Search not found", 400);
  if (await redisClient.has(`${page + search}`)) {
    return res.json({
      data: await redisClient.get(`${page + search}`),
    });
  }
  const url = search.startsWith("http");
  let yt = null;
  if (url) {
    yt = await getInnertubeInstance();
  }
  const [data, ytSongs, yt2Songs] = await Promise.all([
    !url
      ? fetch(
          `${
            process.env.BACKEND_URI
          }/api/search/songs?query=${encodeURIComponent(
            search
          )}&page=${page}&limit=4`
        ).then((res) => res.json())
      : null,
    page === 0 && !url ? ytmusic.searchSongs(search) : null,
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
      video: !s.thumbnails[0].url.includes("https://lh3.googleusercontent.com")
        ? true
        : false,
      image: [
        {
          quality: "500x500",
          url: `https://wsrv.nl/?url=${s.thumbnails[s.thumbnails.length - 1].url
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
        video: !s.thumbnails[0].url.includes(
          "https://lh3.googleusercontent.com"
        )
          ? true
          : false,
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
  await redisClient.set(`${page + search}`, payload);
  return res.json({
    data: payload,
  });
};
