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
  userId?: string
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

    // Execute primary pipeline to get the next song
    let songs = await Queue.aggregate(primaryPipeline);

    // If no song is found, use fallback pipeline for the lowest order song
    if (songs.length === 0) {
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

      // Execute fallback pipeline to get the lowest order song
      songs = await Queue.aggregate(fallbackPipeline);
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
  userId?: string
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

    // Execute primary pipeline to get the previous song
    let songs = await Queue.aggregate(primaryPipeline);

    // If no previous song is found, use fallback pipeline for the highest order song
    if (songs.length === 0) {
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

      // Execute fallback pipeline to get the highest order song
      songs = await Queue.aggregate(fallbackPipeline);
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
