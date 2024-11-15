import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import { VibeCache } from "../cache/cache";
import { decryptObjectValues } from "../lib/utils";
const jwt_secret = process.env.JWT_SECRET || "";
export const login = async (req: CustomRequest, res: Response) => {
  try {
    const data = decryptObjectValues(req.body) as any; // Express uses req.body for JSON data

    const isAlready = await User.findOne({ email: data.email });
    if (isAlready) {
      return proceed(res, isAlready);
    } else {
      const user = await User.create({
        username: data.email
          ?.split("@gmail.com")[0]
          ?.replace(/[^a-zA-Z0-9]/g, ""),
        name: data.display_name,
        email: data.email,
        imageUrl: data.images[0].url,
      });

      if (user) {
        return proceed(res, user);
      }
    }

    return res.status(500).json({ success: false, data: {} });
  } catch (error: any) {
    console.log("LOGIN ERROR", error);

    return res
      .status(500)
      .json({ success: false, data: {}, message: "Something went wrong" });
  }
};

const proceed = (res: Response, saved: any) => {
  const accessToken = jwt.sign({ userId: saved._id }, jwt_secret, {
    expiresIn: "7d",
  });

  VibeCache.del(saved._id.toString());
  // Set the cookie
  res.cookie("vibeIdR", accessToken, {
    httpOnly: true,
    sameSite: "none", // Change to 'None' if using cross-domain
    secure: true, // Ensure your server is running with HTTPS
    path: "/",
    // domain: ".getvibe.in",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Current date + 7 days
  });

  return res.json({ success: true, data: saved, token: accessToken });
};
