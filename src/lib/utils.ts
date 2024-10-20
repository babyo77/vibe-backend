import mongoose from "mongoose";
import Queue from "../models/queueModel";
import RoomUser from "../models/roomUsers";
import { searchResults } from "../../types";

export const parseCookies = (cookieHeader?: string) => {
  const cookies: any = {};
  if (!cookieHeader) return;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.split("=");
    cookies[name.trim()] = decodeURIComponent(rest.join("="));
  });
  return cookies;
};

export const getSongsWithVoteCounts = async (
  roomId: string,
  userId?: string,
  shuffle = false,
  order?: number // Optional order parameter
) => {
  try {
    const pipeline: any[] = [
      {
        $match: {
          roomId: new mongoose.Types.ObjectId(roomId),
          ...(order !== undefined && { order }), // Match songs with specified order if provided
        },
      },
      {
        $lookup: {
          from: "votes", // Lookup votes related to the song
          localField: "_id", // Queue field
          foreignField: "queueId", // Vote field to match
          as: "votes", // Alias the votes array
        },
      },
      {
        $lookup: {
          from: "users", // Lookup for users who added songs
          let: { addedBy: "$songData.addedBy" }, // Reference to addedBy field in songData
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] }, // Match ObjectId of the user who added the song
              },
            },
            {
              $project: {
                name: 1, // Include name
                imageUrl: 1, // Include image URL
                username: 1, // Include username
              },
            },
          ],
          as: "addedByUser", // Alias for the user who added the song
        },
      },
      {
        $unwind: {
          path: "$addedByUser", // Unwind the addedByUser array to get a single user object
          preserveNullAndEmptyArrays: true, // If no user is found, still keep the song
        },
      },
      {
        $addFields: {
          "songData.voteCount": { $size: "$votes" }, // Add the number of votes as voteCount
          "songData.addedByUser": "$addedByUser", // Add user info to songData
          "songData.order": "$order", // Add the song's order
          "songData.topVoterIds": {
            $slice: [
              {
                $map: {
                  input: {
                    $sortArray: { input: "$votes", sortBy: { createdAt: -1 } }, // Sort votes by most recent
                  },
                  as: "vote",
                  in: "$$vote.userId", // Extract userId from each vote
                },
              },
              2, // Limit to top 2 users
            ],
          },
          "songData.isVoted": {
            $cond: {
              if: {
                $and: [
                  { $gt: [{ $size: "$votes" }, 0] }, // Ensure there are votes
                  { $ifNull: [userId, false] }, // Ensure userId exists
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
              else: false, // If no userId or no votes, set isVoted to false
            },
          },
          isPlaying: "$isPlaying", // Keep isPlaying for sorting
        },
      },
      {
        $lookup: {
          from: "users", // Lookup for users based on topVoterIds
          localField: "songData.topVoterIds", // Match with topVoterIds
          foreignField: "_id", // Field from the users collection
          as: "songData.topVoters", // Alias for the top voters details
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field from the result
          songData: 1, // Include only the songData field
          isPlaying: 1, // Include isPlaying for sorting
        },
      },
      {
        $sort: {
          isPlaying: -1, // Sort by currently playing songs first
        },
      },
      {
        $replaceRoot: { newRoot: "$songData" }, // Replace the root with songData
      },
    ];

    if (shuffle) {
      // Shuffle logic if needed
    }

    // Fetch the songs based on the pipeline
    const songs = await Queue.aggregate(pipeline);

    // If no song with the specified order is found, fetch the song with the lowest order
    if (!songs.length && order !== undefined) {
      const fallbackPipeline: any[] = [
        {
          $match: {
            roomId: new mongoose.Types.ObjectId(roomId),
          },
        },
        {
          $sort: { order: 1 }, // Sort by lowest order
        },
        { $limit: 1 }, // Limit to the lowest order song
        ...pipeline.slice(1), // Use the rest of the pipeline logic for lookup and fields
      ];

      return (await Queue.aggregate(fallbackPipeline)) as searchResults[]; // Return fallback song
    }

    return songs as searchResults[]; // Return the result
  } catch (error) {
    console.error("Error fetching songs with vote counts:", error);
    throw error; // Propagate the error
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
  live: true,
  about: {
    description:
      "A real-time music streaming application built using Node.js, Express, Socket.IO, and MongoDB",
    github: "https://github.com/babyo77/vibe-backend",
    website: "https://vibe-drx.vercel.app",
  },
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

export const getMostVotedSongs = async (roomId: string) => {
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
        $project: {
          _id: 0,
          order: 1,
          voteCount: { $size: "$votes" },
        },
      },
      {
        $sort: {
          voteCount: -1, // Sort by vote count in descending order
        },
      },

      { $limit: 1 },
    ];

    const songs = await Queue.aggregate(pipeline);

    return songs as { order: 1; voteCount: 0 }[];
  } catch (error) {
    console.error("Error fetching songs with vote counts:", error);
    throw error;
  }
};
