import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import User from "../models/userModel";
import { decryptObjectValues } from "../lib/utils";

export const updateUserDp = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;
    const data = decryptObjectValues(req.body) as {
      imageUrl: string;
      imageDelUrl: string;
    };
    if (!userId) throw new Error("Login required");
    if (
      !data.imageUrl ||
      !data.imageDelUrl ||
      typeof data.imageUrl !== "string" ||
      typeof data.imageDelUrl !== "string" ||
      data.imageUrl.trim().length == 0 ||
      data.imageDelUrl.trim().length == 0
    )
      throw new Error("Image not provided 🙄");
    await User.findByIdAndUpdate(userId, {
      imageUrl: data.imageUrl,
      imageDelUrl: data.imageDelUrl,
    });

    res.send().status(204);
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, data: {}, message: error?.message });
  }
};
