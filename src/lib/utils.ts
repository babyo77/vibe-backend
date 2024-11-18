import mongoose from "mongoose";
import Queue from "../models/queueModel";
import RoomUser from "../models/roomUsers";
import { searchResults } from "../../types";
import { Innertube } from "youtubei.js";
import ytmusic from "./ytMusic";
import { decrypt, encrypt } from "tanmayo7lock";
import { VibeCache } from "../cache/cache";
import rateLimit from "express-rate-limit";

export const parseCookies = (cookieHeader?: string) => {
  const cookies: any = {};
  if (!cookieHeader) return;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.split("=");
    cookies[name.trim()] = decodeURIComponent(rest.join("="));
  });
  return cookies;
};

export const getCurrentlyPlaying = async (
  roomId: string,
  userId?: string,
  isPlaying: boolean = true
) => {
  try {
    const pipeline: any[] = [
      {
        $match: {
          roomId: new mongoose.Types.ObjectId(roomId),
        },
      },
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "queueId",
          as: "votes",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { addedBy: "$songData.addedBy" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] },
              },
            },
            {
              $project: {
                _id: 0,
                name: 1,
                imageUrl: 1,
                username: 1,
              },
            },
          ],
          as: "addedByUser",
        },
      },
      {
        $unwind: {
          path: "$addedByUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "songData.voteCount": { $size: "$votes" },
          "songData.addedByUser": "$addedByUser",
          "songData.order": "$order",
          "songData.topVoterIds": {
            $slice: [
              {
                $map: {
                  input: {
                    $sortArray: { input: "$votes", sortBy: { createdAt: -1 } },
                  },
                  as: "vote",
                  in: "$$vote.userId",
                },
              },
              2,
            ],
          },
          "songData.isVoted": {
            $cond: {
              if: {
                $and: [
                  { $gt: [{ $size: "$votes" }, 0] },
                  { $ifNull: [userId, false] },
                ],
              },
              then: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$votes",
                        as: "vote",
                        cond: {
                          $eq: [
                            "$$vote.userId",
                            new mongoose.Types.ObjectId(userId),
                          ],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
              else: false,
            },
          },
          isPlaying: "$isPlaying",
          lastVoteTime: { $max: "$votes.createdAt" }, // Capture the latest vote timestamp
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "songData.topVoterIds",
          foreignField: "_id",
          as: "songData.topVoters",
        },
      },
      {
        $addFields: {
          "songData.topVoters": {
            $map: {
              input: "$songData.topVoters",
              as: "voter",
              in: {
                name: "$$voter.name",
                username: "$$voter.username",
                imageUrl: "$$voter.imageUrl",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          songData: 1,
          isPlaying: 1,
          lastVoteTime: 1, // Include lastVoteTime for sorting
        },
      },
    ];

    if (isPlaying) {
      pipeline.push({
        $sort: {
          isPlaying: -1,
        },
      });
    } else {
      pipeline.push(
        {
          $match: {
            "songData.voteCount": { $gt: 0 },
          },
        },
        {
          $sort: {
            "songData.voteCount": -1, // Primary sort by vote count
            lastVoteTime: 1, // Secondary sort by latest vote time (reverse)
          },
        }
      );
    }

    pipeline.push(
      { $limit: 3 },
      { $replaceRoot: { newRoot: "$songData" } },
      { $project: { topVoterIds: 0 } }
    );

    const songs = (await Queue.aggregate(pipeline)) || [];

    return songs as searchResults[];
  } catch (error) {
    console.error("Error fetching songs with vote counts:", error);
    return [];
  }
};

export const getListener = async (roomId: string) => {
  const roomUsers = await RoomUser.find({
    roomId: roomId,
    active: true,
  })
    .populate({
      path: "userId", // The path to populate
      select: "name username imageUrl", // Only select the 'name' and 'username' fields
    })
    .limit(17);

  const totalListeners = await RoomUser.countDocuments({
    roomId: roomId,
    active: true,
  });

  return {
    totalUsers: totalListeners,
    currentPage: 1,
    roomUsers,
  };
};

export const homeResponse = {
  info: "@babyo7_",
  code: "777",
  bio: "cursed",
};

export const cors = {
  origin: true,
  credentials: true,
};

export const shuffleArray = (queue: searchResults[]) => {
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  return queue;
};

export const getTime = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Use 12-hour format with AM/PM
    timeZone: "Asia/Kolkata", // Set the time zone to IST
  };
  const timestamp = now.toLocaleTimeString("en-US", options); // Get the time in 'hh:mm AM/PM' format
  return timestamp;
};

export const getSongByOrder = async (
  roomId: string,
  order: number,
  userId?: string,
  currentSong?: searchResults
) => {
  try {
    // Primary pipeline to find the next song in ascending order
    const primaryPipeline: any[] = [
      {
        $match: {
          roomId: new mongoose.Types.ObjectId(roomId),
          order: { $gt: order }, // Only songs with order greater than the specified order
        },
      },
      { $sort: { order: 1 } }, // Ascending to get the next song
      { $limit: 3 }, // Get only the next song
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "queueId",
          as: "votes",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { addedBy: "$songData.addedBy" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] },
              },
            },
            {
              $project: {
                _id: 0,
                name: 1,
                imageUrl: 1,
                username: 1,
              },
            },
          ],
          as: "addedByUser",
        },
      },
      {
        $unwind: {
          path: "$addedByUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "songData.voteCount": { $size: "$votes" },
          "songData.order": "$order",
          "songData.addedByUser": "$addedByUser",
          "songData.topVoterIds": {
            $slice: [
              {
                $map: {
                  input: {
                    $sortArray: { input: "$votes", sortBy: { createdAt: -1 } },
                  },
                  as: "vote",
                  in: "$$vote.userId",
                },
              },
              2, // Top 2 users
            ],
          },
          "songData.isVoted": {
            $cond: {
              if: {
                $and: [
                  { $gt: [{ $size: "$votes" }, 0] },
                  { $ifNull: [userId, false] },
                ],
              },
              then: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$votes",
                        as: "vote",
                        cond: {
                          $eq: [
                            "$$vote.userId",
                            new mongoose.Types.ObjectId(userId),
                          ],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
              else: false,
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "songData.topVoterIds",
          foreignField: "_id",
          as: "songData.topVoters",
        },
      },
      {
        $addFields: {
          "songData.topVoters": {
            $map: {
              input: "$songData.topVoters",
              as: "voter",
              in: {
                name: "$$voter.name",
                username: "$$voter.username",
                imageUrl: "$$voter.imageUrl",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          songData: 1,
        },
      },
      { $replaceRoot: { newRoot: "$songData" } },
    ];
    const fallbackPipeline: any[] = [
      {
        $match: { roomId: new mongoose.Types.ObjectId(roomId) },
      },
      { $sort: { order: 1 } }, // Ascending order for the lowest order song
      { $limit: 3 },
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "queueId",
          as: "votes",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { addedBy: "$songData.addedBy" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] },
              },
            },
            {
              $project: {
                _id: 0,
                name: 1,
                imageUrl: 1,
                username: 1,
              },
            },
          ],
          as: "addedByUser",
        },
      },
      {
        $unwind: {
          path: "$addedByUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "songData.voteCount": { $size: "$votes" },
          "songData.order": "$order",
          "songData.addedByUser": "$addedByUser",
          "songData.isVoted": {
            $cond: {
              if: {
                $and: [
                  { $gt: [{ $size: "$votes" }, 0] },
                  { $ifNull: [userId, false] },
                ],
              },
              then: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$votes",
                        as: "vote",
                        cond: {
                          $eq: [
                            "$$vote.userId",
                            new mongoose.Types.ObjectId(userId),
                          ],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          songData: 1,
        },
      },
      { $replaceRoot: { newRoot: "$songData" } },
    ];
    // Execute primary pipeline to get the next song
    let songs = await Queue.aggregate(primaryPipeline);
    if (songs.length !== 0) {
      VibeCache.del(`${roomId}suggestion`);
    }
    if (songs.length === 0) {
      songs = await getSongs(roomId, currentSong, "next", fallbackPipeline);
    }
    return songs.length > 0 ? songs : []; // Return the song or null if none found
  } catch (error) {
    console.error("Error fetching the next song by order:", error);
    throw error;
  }
};

export const getPreviousSongByOrder = async (
  roomId: string,
  order: number,
  userId?: string,
  currentSong?: searchResults
) => {
  try {
    // Primary pipeline to find the previous song in descending order
    const primaryPipeline: any[] = [
      {
        $match: {
          roomId: new mongoose.Types.ObjectId(roomId),
          order: { $lt: order }, // Only songs with order less than the specified order
        },
      },
      { $sort: { order: -1 } }, // Descending to get the previous song
      { $limit: 1 }, // Get only the previous song
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "queueId",
          as: "votes",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { addedBy: "$songData.addedBy" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] },
              },
            },
            {
              $project: {
                _id: 0,
                name: 1,
                imageUrl: 1,
                username: 1,
              },
            },
          ],
          as: "addedByUser",
        },
      },
      {
        $unwind: {
          path: "$addedByUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "songData.voteCount": { $size: "$votes" },
          "songData.order": "$order",
          "songData.addedByUser": "$addedByUser",
          "songData.isVoted": {
            $cond: {
              if: {
                $and: [
                  { $gt: [{ $size: "$votes" }, 0] },
                  { $ifNull: [userId, false] },
                ],
              },
              then: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$votes",
                        as: "vote",
                        cond: {
                          $eq: [
                            "$$vote.userId",
                            new mongoose.Types.ObjectId(userId),
                          ],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
              else: false,
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "songData.topVoterIds",
          foreignField: "_id",
          as: "songData.topVoters",
        },
      },
      {
        $addFields: {
          "songData.topVoters": {
            $map: {
              input: "$songData.topVoters",
              as: "voter",
              in: {
                name: "$$voter.name",
                username: "$$voter.username",
                imageUrl: "$$voter.imageUrl",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          songData: 1,
        },
      },
      { $replaceRoot: { newRoot: "$songData" } },
    ];
    const fallbackPipeline: any[] = [
      {
        $match: { roomId: new mongoose.Types.ObjectId(roomId) },
      },
      { $sort: { order: -1 } }, // Descending to get the highest order song
      { $limit: 1 },
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "queueId",
          as: "votes",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { addedBy: "$songData.addedBy" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] },
              },
            },
            {
              $project: {
                _id: 0,
                name: 1,
                imageUrl: 1,
                username: 1,
              },
            },
          ],
          as: "addedByUser",
        },
      },
      {
        $unwind: {
          path: "$addedByUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "songData.voteCount": { $size: "$votes" },
          "songData.order": "$order",
          "songData.addedByUser": "$addedByUser",
          "songData.isVoted": {
            $cond: {
              if: {
                $and: [
                  { $gt: [{ $size: "$votes" }, 0] },
                  { $ifNull: [userId, false] },
                ],
              },
              then: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$votes",
                        as: "vote",
                        cond: {
                          $eq: [
                            "$$vote.userId",
                            new mongoose.Types.ObjectId(userId),
                          ],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          songData: 1,
        },
      },
      { $replaceRoot: { newRoot: "$songData" } },
    ];

    // Execute primary pipeline to get the previous song
    let songs = await Queue.aggregate(primaryPipeline);
    if (songs.length !== 0) {
      VibeCache.del(`${roomId}suggestion`);
    }
    if (songs.length === 0) {
      songs = await getSongs(roomId, currentSong, "prev", fallbackPipeline);
    }
    return songs.length > 0 ? songs : []; // Return the song or null if none found
  } catch (error) {
    console.error("Error fetching the previous song by order:", error);
    throw error;
  }
};

// Function to construct the aggregation pipeline
export function getQueuePipeline(
  roomId: string,
  userId?: string,
  page = 1,
  limit = 50,
  search = ""
) {
  const pipeline: any = [
    {
      $match: {
        roomId: new mongoose.Types.ObjectId(roomId),
      },
    },
    {
      $lookup: {
        from: "votes",
        localField: "_id",
        foreignField: "queueId",
        as: "votes",
      },
    },
    {
      $lookup: {
        from: "users",
        let: { addedBy: "$songData.addedBy" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] },
            },
          },
          {
            $project: {
              _id: 0,
              name: 1,
              imageUrl: 1,
              username: 1,
            },
          },
        ],
        as: "addedByUser",
      },
    },
    {
      $unwind: {
        path: "$addedByUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        "songData.voteCount": { $size: "$votes" },
        "songData.addedByUser": "$addedByUser",
        "songData.order": "$order",
        "songData.topVoterIds": {
          $slice: [
            {
              $map: {
                input: {
                  $sortArray: { input: "$votes", sortBy: { createdAt: -1 } },
                },
                as: "vote",
                in: "$$vote.userId",
              },
            },
            2,
          ],
        },
        "songData.isVoted": {
          $cond: {
            if: {
              $and: [
                { $gt: [{ $size: "$votes" }, 0] },
                { $ifNull: [userId, false] },
              ],
            },
            then: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$votes",
                      as: "vote",
                      cond: {
                        $eq: [
                          "$$vote.userId",
                          new mongoose.Types.ObjectId(userId),
                        ],
                      },
                    },
                  },
                },
                0,
              ],
            },
            else: false,
          },
        },
        isPlaying: "$isPlaying",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "songData.topVoterIds",
        foreignField: "_id",
        as: "songData.topVoters",
      },
    },
    {
      $addFields: {
        "songData.topVoters": {
          $map: {
            input: "$songData.topVoters",
            as: "voter",
            in: {
              name: "$$voter.name",
              username: "$$voter.username",
              imageUrl: "$$voter.imageUrl",
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        songData: 1,
        isPlaying: 1,
        order: 1,
      },
    },
    {
      $sort: {
        order: -1,
      },
    },
    {
      $replaceRoot: { newRoot: "$songData" },
    },
    {
      $project: {
        topVoterIds: 0,
      },
    },
  ];

  if (search && search.trim() !== "") {
    pipeline.push({
      $match: {
        name: { $regex: search, $options: "i" },
      },
    });
  }

  pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

  return pipeline;
}

let ytInstance: Innertube | null = null;
export const getInnertubeInstance = async () => {
  if (!ytInstance) {
    ytInstance = await Innertube.create({
      cookie: process.env.COOKIES,
    });
  }
  return ytInstance;
};

async function fetchSuggestedSongs(
  roomId: string,
  currentSong: searchResults
): Promise<searchResults[] | null> {
  try {
    let suggestionId =
      currentSong.downloadUrl[currentSong.downloadUrl.length - 1].url;

    if (suggestionId.startsWith("http")) {
      const searchResults = await ytmusic.searchSongs(
        `${currentSong.name} ${currentSong.artists.primary[0]?.name}`
      );
      suggestionId = encrypt(searchResults[0]?.videoId || "");
    }

    const response = await fetch(
      `${process.env.SUGGESTION_API}/vibe/${suggestionId}`
    );
    if (response.ok) {
      const songs = await response.json();
      VibeCache.set(`${roomId}suggestion`, songs);
      return songs;
    }
  } catch (error) {
    console.log("SUGGESTION ERROR:", error, roomId);
  }
  return null;
}

async function getSongs(
  roomId: string,
  currentSong?: searchResults,
  direction: "next" | "prev" = "next",
  fallbackPipeline?: any[]
): Promise<searchResults[]> {
  if (!currentSong) return await Queue.aggregate(fallbackPipeline);
  if (
    currentSong.suggestedOrder &&
    direction == "prev" &&
    currentSong.suggestedOrder == 1
  ) {
    return await Queue.aggregate(fallbackPipeline);
  }
  let suggestedSongs = VibeCache.get(`${roomId}suggestion`) as
    | searchResults[]
    | null;
  if (!suggestedSongs) {
    suggestedSongs = await fetchSuggestedSongs(roomId, currentSong);
  }

  if (suggestedSongs) {
    // Locate the current song's index based on suggestedOrder
    const currentIndex = suggestedSongs.findIndex(
      (song) => song.suggestedOrder === currentSong.suggestedOrder
    );
    let targetIndex = currentIndex;

    if (direction === "next") {
      targetIndex = currentIndex + 1;
    } else if (direction === "prev") {
      targetIndex = currentIndex - 1;
    }

    // Check if targetIndex is within bounds
    if (targetIndex >= 0 && targetIndex < suggestedSongs.length) {
      // Get the remaining songs after the target index (next or prev direction)
      const remainingSongs =
        direction === "next"
          ? suggestedSongs.slice(targetIndex) // Songs after the target song
          : suggestedSongs.slice(0, targetIndex + 1).reverse(); // Songs before the target song (reversed for prev)

      // Return the song at target index along with the rest of the filtered songs

      return [
        suggestedSongs[targetIndex],
        ...remainingSongs.filter(
          (song) =>
            song.suggestedOrder !== suggestedSongs![targetIndex].suggestedOrder
        ),
      ];
    }

    // Reload suggestions if no valid next/prev song is found in cache
    VibeCache.del(`${roomId}suggestion`);
    suggestedSongs = await fetchSuggestedSongs(roomId, currentSong);

    if (suggestedSongs) {
      // For "next", return the first song, and for "prev", return the last song
      const newIndex = direction === "next" ? 0 : suggestedSongs.length - 1;
      return [suggestedSongs[newIndex]];
    }
  }

  // Fallback if no suggestions are found
  return await Queue.aggregate(fallbackPipeline);
}

export function encryptObjectValues(obj: any[]) {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = encrypt(obj[key as any]); // Apply decrypt to each value
    return acc;
  }, {} as Record<string, string>);
}

export function decryptObjectValues(obj: any[]) {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = decrypt(obj[key as any]); // Apply decrypt to each value
    return acc;
  }, {} as Record<string, string>);
}

export function getRandomEmoji(emojis: string[]): string {
  const randomIndex = Math.floor(Math.random() * emojis.length);
  return emojis[randomIndex];
}

export const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
  },
});
