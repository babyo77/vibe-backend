import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Room from "../models/roomModel";
import { ApiError } from "./apiError";

export async function checkRoom(
  req: CustomRequest,
  res: Response
): Promise<Response> {
  const roomName = req.query.r;
  if (!roomName || typeof roomName !== "string")
    throw new ApiError("Room name not provided");
  const isValidRoomId = /^[a-zA-Z0-9]+$/.test(roomName);

  if (roomName.length <= 3) {
    throw new ApiError("Name is too short, minimum 4 characters", 400);
  }
  if (roomName.length > 11) {
    throw new ApiError("Name is too large, maximum 11 characters", 400);
  }

  if (!isValidRoomId) {
    throw new ApiError("Special characters not allowed", 400);
  }
  const isExist = await Room.exists({ roomId: roomName });

  if (isExist) {
    throw new ApiError("Name already taken", 409);
  }
  return res.json({ success: true, data: { exists: true } });
}
