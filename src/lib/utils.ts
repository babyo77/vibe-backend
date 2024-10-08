import mongoose from "mongoose";
import Vote from "../models/voteModel";
import Queue from "../models/queueModel";
import RoomUser from "../models/roomUsers";

export const parseCookies = (cookieHeader?: string) => {
  const cookies: any = {};
  if (!cookieHeader) return;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.split("=");
    cookies[name.trim()] = decodeURIComponent(rest.join("="));
  });
  return cookies;
};

export const getSongsWithVoteCounts = async (roomId: string, sort = false) => {
  try {
    const songsWithVoteCounts = await Queue.aggregate([
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
        $addFields: {
          "songData.voteCount": { $size: "$votes" }, // Add voteCount directly to songData
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field from the result
          songData: 1, // Include only the songData field
          createdAt: 1, // Include the createdAt field for sorting
        },
      },
      {
        $replaceRoot: { newRoot: "$songData" }, // Replace the root with songData
      },
      {
        $sort: {
          voteCount: sort ? -1 : 1, // Sort by voteCount in descending order (most votes first)
          createdAt: -1, // Then sort by createdAt in descending order (latest first)
        },
      },
    ]);

    return songsWithVoteCounts; // Return the sorted array of songData
  } catch (error) {
    console.error("Error fetching songs with vote counts:", error);
    throw error; // Propagate the error for handling by the caller
  }
};

export const getVotesArray = async (roomId: string, userId?: string) => {
  if (!userId) return;
  const votedArray = await Vote.find({ roomId: roomId, userId });
  return votedArray;
};

export const getListener = async (roomId: string) => {
  const roomUsers = await RoomUser.find({
    roomId: roomId,
    active: true,
  })
    .populate("userId")
    .limit(5);

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
