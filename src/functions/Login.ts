import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import { VibeCache } from "../cache/cache";
import admin from "../../firebase/firebase";
const jwt_secret = process.env.JWT_SECRET || "";
export const login = async (req: CustomRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) throw new Error("Gotach u 🤣");

    const verify = await admin.auth().verifyIdToken(token);

    if (!verify) {
      throw new Error("Invalid token 🤡");
    }

    const isAlready = await User.findOne({ email: verify.email });
    if (isAlready) {
      await User.findByIdAndUpdate(isAlready._id, {
        imageUrl: verify?.picture,
      });
      return proceed(res, isAlready);
    } else {
      if (!verify.name || !verify.email || !verify.picture)
        throw new Error("Invalid data");
      const user = await User.create({
        username: verify.email
          ?.split("@gmail.com")[0]
          ?.replace(/[^a-zA-Z0-9]/g, ""),
        name: verify?.name,
        email: verify?.email,
        imageUrl: verify?.picture,
      });

      if (user) {
        return proceed(res, user);
      }
    }

    return res.status(500).json({ success: false, data: {} });
  } catch (error: any) {
    console.log("LOGIN ERROR", error);

    return res.status(500).json({ success: false, message: "Gotach u 🤣" });
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

  return res.json({ success: true, data: {}, token: accessToken });
};
