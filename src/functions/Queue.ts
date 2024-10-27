import { Response } from "express";
import { getQueuePipeline } from "../lib/utils";
import { CustomRequest } from "../middleware/auth";
import Queue from "../models/queueModel";
import Room from "../models/roomModel";

export const queue = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const name = String(req.query.name) || "";
    const roomId = String(req.query.room) || "";

    if (!roomId) throw new Error("Invalid roomId");

    const room = await Room.findOne({ roomId }).select("_id");
    if (!room) throw new Error("Room not found");

    const [total, results] = await Promise.all([
      Queue.countDocuments({ roomId: room._id }),
      Queue.aggregate(getQueuePipeline(room._id, userId, page, limit, name)),
    ]);

    const payload = {
      total,
      start: page,
      results,
    };

    return res.json(payload);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
