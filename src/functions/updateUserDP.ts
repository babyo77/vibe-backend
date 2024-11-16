import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import User from "../models/userModel";

export const updateUserDp = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { imageUrl, imageDelUrl } = req.body;
    if (!userId) throw new Error("Login required");
    if (
      !imageUrl ||
      !imageDelUrl ||
      typeof imageUrl !== "string" ||
      typeof imageDelUrl !== "string" ||
      imageUrl.trim().length == 0 ||
      imageDelUrl.trim().length == 0
    )
      throw new Error("Image not provided 🙄");
    await User.findByIdAndUpdate(userId, {
      imageUrl,
      imageDelUrl,
    });

    res.send().status(204);
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, data: {}, message: error?.message });
  }
};
