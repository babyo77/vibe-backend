import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Spotify from "../lib/spotify";
import { encrypt } from "tanmayo7lock";
import ytmusic from "../lib/ytMusic";
import { ApiError } from "./apiError";
import { tnzara } from "../cache/cache";

export const getSpotifyPlaylist = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  try {
    const id = req.params.id;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const offset = (page - 1) * pageSize;
    const cache_key = `${id}:${page}:${pageSize}`;

    // Check cache first
    if (tnzara.has(cache_key)) {
      return res.json(tnzara.get(cache_key));
    }

    const song = await Spotify.getPlaylistTracks(id, {
      limit: pageSize,
      offset: offset,
    });

    const songsNameWithArtist = song.body.items
      .map((item) => {
        const name = item?.track?.name;
        const artist = item?.track?.artists[0]?.name;
        return name && artist ? { search: `${name} ${artist}` } : null;
      })
      .filter((item): item is { search: string } => item !== null);

    const ytSongs = await Promise.all(
      songsNameWithArtist.map(({ search }) => ytmusic.searchSongs(search))
    );

    const tracks = ytSongs
      .map((ytSongResults) => {
        const ytSong = ytSongResults[0];
        if (!ytSong) return null;

        return {
          id: ytSong.videoId,
          name: ytSong.name,
          artists: {
            primary: [
              {
                name: ytSong.artist.name,
              },
            ],
          },
          video: !ytSong.thumbnails[0].url.includes(
            "https://lh3.googleusercontent.com"
          ),
          image: [
            {
              quality: "500x500",
              url: `https://wsrv.nl/?url=${ytSong.thumbnails[
                ytSong.thumbnails.length - 1
              ].url.replace("w120-h120", "w500-h500")}`,
            },
          ],
          source: "youtube",
          downloadUrl: [
            {
              quality: "320kbps",
              url: encrypt(ytSong.videoId),
            },
          ],
        };
      })
      .filter(Boolean);

    // const payload = {
    //   data: {
    //     next: song.body.next,
    //     total: song.body.total,
    //     results: tracks,
    //   },
    // };

    tnzara.set(cache_key, tracks);

    return res.json(tracks);
  } catch (error) {
    throw new ApiError("Error fetching playlist", 500);
  }
};
