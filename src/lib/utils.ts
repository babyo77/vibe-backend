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
        $lookup: {
          from: "users", // Name of the users collection
          let: { addedBy: "$songData.addedBy" }, // Pass the addedBy string
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] }, // Match users using ObjectId
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
                    $sortArray: { input: "$votes", sortBy: { createdAt: -1 } }, // Sort votes by createdAt (latest first)
                  },
                  as: "vote",
                  in: "$$vote.userId", // Extract the userId from each vote
                },
              },
              3, // Limit to top 3 users
            ],
          },
        },
      },
      // Lookup the top voters from the users collection
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
          createdAt: 1, // Include the createdAt field for sorting
        },
      },
      {
        $replaceRoot: { newRoot: "$songData" }, // Replace the root with songData
      },
      {
        $sort: {
          voteCount: sort ? -1 : 1, // Sort by voteCount (desc or asc)
          createdAt: -1, // Then sort by createdAt (latest first)
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
  const votedArray = await Vote.find({ roomId: roomId, userId: userId });
  return votedArray;
};

export const getListener = async (roomId: string) => {
  const roomUsers = await RoomUser.find({
    roomId: roomId,
    active: true,
  })
    .populate("userId")
    .limit(4);

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
