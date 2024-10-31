import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import mongoose from "mongoose";
import RoomUser from "../models/roomUsers";

export async function getRooms(req: CustomRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const roomAdmins = await RoomUser.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "rooms",
          localField: "roomId",
          foreignField: "_id",
          as: "roomDetails",
        },
      },
      {
        $unwind: "$roomDetails",
      },
      {
        $lookup: {
          from: "roomusers",
          let: { roomId: "$roomId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$roomId", "$$roomId"] },
                    { $eq: ["$role", "admin"] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "adminDetails",
              },
            },
            {
              $unwind: "$adminDetails",
            },
            {
              $project: {
                _id: 0,
                adminName: "$adminDetails.name",
              },
            },
          ],
          as: "admins",
        },
      },
      {
        $lookup: {
          from: "roomusers",
          let: { roomId: "$roomId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$roomId", "$$roomId"],
                },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userDetails",
              },
            },
            {
              $unwind: "$userDetails",
            },
            {
              $sample: { size: 4 },
            },
            {
              $project: {
                _id: 0,
                image: "$userDetails.imageUrl",
              },
            },
          ],
          as: "users",
        },
      },
      {
        $lookup: {
          from: "queues",
          let: { roomId: "$roomId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$roomId", "$$roomId"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                isPlaying: 1,
                songData: 1,
              },
            },
            {
              $sort: {
                isPlaying: -1,
              },
            },
          ],
          as: "currentSong",
        },
      },
      {
        $match: {
          $expr: {
            $gt: [{ $size: "$currentSong" }, 0],
          },
        },
      },
      {
        $project: {
          roomId: "$roomDetails.roomId",
          name: {
            $map: { input: "$admins", as: "admin", in: "$$admin.adminName" },
          },
          users: 1,
          background: {
            $let: {
              vars: {
                filteredImages: {
                  $filter: {
                    input: { $arrayElemAt: ["$currentSong.songData.image", 0] },
                    as: "bg",
                    cond: { $eq: ["$$bg.quality", "500x500"] },
                  },
                },
              },
              in: {
                $cond: {
                  if: { $gt: [{ $size: "$$filteredImages" }, 0] },
                  then: { $arrayElemAt: ["$$filteredImages.url", 0] }, // Extracting the URL directly
                  else: "randomImageUrl", // Fallback URL
                },
              },
            },
          },
          updatedAt: 1,
        },
      },
      {
        $match: {
          $expr: {
            $gt: [{ $size: "$name" }, 0],
          },
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
      {
        $limit: 4,
      },
      {
        $project: {
          _id: 0,
          roomId: 1,
          name: 1,
          users: 1,
          background: 1, // Keeping it simple, now just a string
        },
      },
    ]);

    res.json(roomAdmins);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}
