import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Spotify from "../lib/spotify";
import { encrypt } from "tanmayo7lock";
import ytmusic from "../lib/ytMusic";
import { tnzara } from "../cache/cache";

export const getSpotifyTrack = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const id = req.params.id;
  const key = "spotify" + id;
  if (tnzara.has(key)) {
    return res.json(tnzara.get(key));
  }
  const token = await Spotify.clientCredentialsGrant();
  Spotify.setAccessToken(token.body["access_token"]);
  const song = await Spotify.getTrack(id);
  const artist = song.body.artists[0].name;
  const name = song.body.name;
  const ytSongs = await ytmusic.searchSongs(`${name} ${artist}`);
  const tracks =
    ytSongs?.slice(0, 1).map((s: any) => ({
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
  const payload = { data: { results: tracks } };
  tnzara.set(key, payload);
  return res.json(payload);
};
