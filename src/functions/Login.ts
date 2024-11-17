import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import { VibeCache } from "../cache/cache";
import admin from "../../firebase/firebase";
import { ApiError } from "./apiError";

const jwt_secret = process.env.JWT_SECRET || "";
export const login = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const { token } = req.body;

  if (!token) throw new ApiError("Gotach u", 403);

  const verify = await admin.auth().verifyIdToken(token);

  if (!verify) {
    throw new ApiError("Invalid token 🤡", 403);
  }

  const isAlready = await User.findOne({ email: verify.email });
  if (isAlready) {
    return proceed(res, isAlready);
  } else {
    if (!verify.name || !verify.email || !verify.picture)
      throw new ApiError("Invalid data", 403);
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
    } else {
      throw new ApiError("Unable to create user", 500);
    }
  }
};

const proceed = (res: Response, saved: any) => {
  const accessToken = jwt.sign({ userId: saved._id }, jwt_secret, {
    expiresIn: "7d",
  });

  VibeCache.del(saved._id.toString());
  res.cookie("vibeIdR", accessToken, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",

    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return res.json({ success: true, data: {}, token: accessToken });
};
