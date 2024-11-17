import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import RoomUser from "../models/roomUsers";
import User from "../models/userModel";
import Room from "../models/roomModel";
import { apiError } from "./apiError";

export async function checkVibe(req: CustomRequest, res: Response) {
  try {
    const userId = req.userId;
    const session =
      req.cookies.vibeIdR || req.headers.authorization?.split(" ")[1]; // Get cookies from the request
    const roomId = req.cookies?.room; // Get room ID from cookies

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const [user, room] = await Promise.all([
      User.findById(userId), // Fetch the user by ID
      Room.findOne({ roomId }), // Fetch the room by roomId
    ]);

    const roleData = await RoomUser.findOne({
      userId: userId,
      roomId: room?._id,
    }).select("role");

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const userData = {
      ...user.toObject(),
      token: session,
      roomId,
      role: roleData?.role || "guest",
    };

    return res.json(userData); // Send JSON response with user data
  } catch (error: any) {
    console.error("Error in getLoggedInUser:", error.message);
    return apiError(res, "An error occurred while retrieving user data.");
  }
}
