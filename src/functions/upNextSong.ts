import { Response } from "express";
import { getCurrentlyPlaying, getSongByOrder } from "../lib/utils";
import { CustomRequest } from "../middleware/auth";
import Room from "../models/roomModel";

export const upNextSong = async (req: CustomRequest, res: Response) => {
  try {
    const roomId = String(req.query.room) || "";

    if (!roomId) throw new Error("Invalid roomId");

    const room = await Room.findOne({ roomId });
    if (!room) return res.status(400).json({ message: "Invalid roomId" });

    let nextSong = [];
    const value = (await getCurrentlyPlaying(room._id))[0];
    nextSong = await getCurrentlyPlaying(room?._id, undefined, false);
    if (nextSong?.length == 0) {
      nextSong = await getSongByOrder(room?._id, value?.order);
    }

    res.json(nextSong);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
