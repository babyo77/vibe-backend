import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Room from "../models/roomModel";
import RoomUser from "../models/roomUsers";
import { VibeCache } from "../cache/cache";

export const roomListeners = async (req: CustomRequest, res: Response) => {
  try {
    const roomId = String(req.query.room) || "";
    if (!roomId) throw new Error("Invalid roomId");

    // Check cache first
    const cacheKey = roomId + "listeners";
    if (VibeCache.has(cacheKey)) {
      return res.json(VibeCache.get(cacheKey));
    }

    const room = await Room.findOne({ roomId }).select("_id");
    // Run queries in parallel
    const [roomUsers, totalListeners, isAdminActive] = await Promise.all([
      // Fetch only `_id` for the room
      RoomUser.find({ roomId: room._id, active: true })
        .populate({
          path: "userId",
          select: "name username imageUrl", // Fetch only necessary fields
        })
        .limit(17)
        .select("userId -_id"), // Limit fields and records returned
      RoomUser.countDocuments({ roomId: room._id, active: true }), // Count active listeners
      RoomUser.exists({ roomId: room._id, role: "admin", active: true }), // Check if any admin is active
    ]);

    // Check if room exists
    if (!room) return res.status(400).json({ message: "Invalid roomId" });

    // Prepare payload
    const payload = {
      totalUsers: totalListeners + 1,
      isAdminActive: Boolean(isAdminActive), // Convert result to boolean
      currentPage: 1,
      roomUsers,
    };

    // Cache the result
    VibeCache.set(cacheKey, payload);
    res.json(payload);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
