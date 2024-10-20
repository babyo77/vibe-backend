import mongoose from "mongoose";
import Queue from "../models/queueModel";
import RoomUser from "../models/roomUsers";
import { CustomSocket, searchResults } from "../../types";

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
  sort = false,
  shuffle = false
) => {
  try {
    const pipeline: any[] = [
      {
        $match: { roomId: new mongoose.Types.ObjectId(roomId) }, // Match songs in the specified room
      },
      {
        $lookup: {
          from: "votes", // Name of the votes collection
          localField: "_id", // Field from the Queue collection
          foreignField: "queueId", // Field from the Vote collection
          as: "votes", // Alias for the resulting array of votes
        },
      },
      {
        $lookup: {
          from: "users", // Name of the users collection
          let: { addedBy: "$songData.addedBy" }, // Pass the addedBy string
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] }, // Match users using ObjectId
              },
            },
            {
              $project: {
                // Only include the fields you need
                name: 1, // Include the user's name
                imageUrl: 1, // Include the user's image
                username: 1, // Include the user's username
                _id: 0, // Exclude the _id field (optional)
              },
            },
          ],
          as: "addedByUser", // Alias for the resulting user data
        },
      },
      {
        $unwind: {
          path: "$addedByUser", // Unwind the addedByUser array
          preserveNullAndEmptyArrays: true, // Keep the song even if no user is found
        },
      },
      {
        $addFields: {
          "songData.voteCount": { $size: "$votes" }, // Add voteCount directly to songData
          "songData.addedByUser": "$addedByUser", // Add user details to songData
          "songData.topVoterIds": {
            $slice: [
              {
                $map: {
                  input: {
                    $sortArray: { input: "$votes", sortBy: { createdAt: -1 } },
                  },
                  as: "vote",
                  in: "$$vote.userId", // Extract the userId from each vote
                },
              },
              4, // Limit to top 2 users
            ],
          },
          // Check if the current user has voted
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
              else: false, // If no userId is present or no votes, set isVoted to false
            },
          },
          // Include isPlaying directly for sorting
          isPlaying: "$isPlaying", // Keep isPlaying for sorting
        },
      },
      {
        $lookup: {
          from: "users", // Name of the users collection
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
          createdAt: 1, // Include the createdAt field for sorting
        },
      },
      {
        // Move the $sort stage here to prioritize isPlaying
        $sort: {
          // Sort by vote count in descending order (most voted first)
          isPlaying: -1,
          // Still prioritize songs that are currently playing
        },
      },
      {
        $replaceRoot: { newRoot: "$songData" }, // Replace the root with songData
      },
      {
        $limit: 117,
      },
    ];
    if (shuffle) {
      pipeline.push({ $sample: { size: 117 } });
    }
    return await Queue.aggregate(pipeline); // Return the sorted array of songData
  } catch (error) {
    console.error("Error fetching songs with vote counts:", error);
    throw error; // Propagate the error for handling by the caller
  }
};

export const getVotesArray = async (roomId: string, userId?: string) => {
  if (!userId) return;
  return [];
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
  };
  const timestamp = now.toLocaleTimeString("en-US", options); // Get the time in 'hh:mm AM/PM' format
  return timestamp;
};
