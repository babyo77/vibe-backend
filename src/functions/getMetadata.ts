import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import User from "../models/userModel";
import Room from "../models/roomModel";
import RoomUser from "../models/roomUsers";
import { VibeCache } from "../cache/cache";

export const getMetadata = async (req: CustomRequest, res: Response) => {
  const data = req.body;
  let metadata: any = {};
  try {
    if (data.payload == "user") {
      const userMetadata = await User.findOne({ username: data.text }).select(
        "name imageUrl -_id"
      );
      metadata = userMetadata;
    } else if (data.payload == "roomAdmin") {
      if (VibeCache.has(data.text + "roomAdmin")) {
        return res.json(VibeCache.get(data.text + "roomAdmin"));
      }
      const room = VibeCache.has(data.text + "roomId")
        ? VibeCache.get(data.text + "roomId")
        : await Room.findOne({ roomId: data.text });
      const adminMetadata = await RoomUser.findOne({
        roomId: room?._id,
        role: "admin",
      })
        .populate({
          path: "userId",
          select: "name imageUrl -_id",
        })
        .select("userId");
      if (!adminMetadata) throw new Error("No admin");
      const { name, imageUrl } = adminMetadata?.userId || {};
      VibeCache.set(data.text + "roomAdmin", { name, imageUrl });
      metadata = { name, imageUrl };
    }

    res.json(metadata);
  } catch (error: any) {
    console.log(error);

    res.status(500).json({ message: error.message });
  }
};
