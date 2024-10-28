import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import User from "../models/userModel";

export const getMe = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findById(userId);

    res.json(user);
  } catch (error: any) {
    return res.status(500).json({ message: error.message, error: true });
  }
};
