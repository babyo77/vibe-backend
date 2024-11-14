import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Room from "../models/roomModel";

export async function checkRoom(req: CustomRequest, res: Response) {
  try {
    const roomName = req.query.r;
    if (!roomName || typeof roomName !== "string")
      throw new Error("Room name not provided");
    const isValidRoomId = /^[a-zA-Z0-9]+$/.test(roomName);

    if (roomName.length <= 3) {
      throw new Error("Name is too short, minimum 4 characters");
    }
    if (roomName.length > 11) {
      throw new Error("Name is too large, maximum 11 characters");
    }

    if (!isValidRoomId) {
      throw new Error("Special characters not allowed");
    }
    const isExist = await Room.exists({ roomId: roomName });

    if (isExist) {
      throw new Error("Name already taken");
    }
    return res.json({ success: true, data: { exists: true } });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, data: {}, message: error?.message });
  }
}
