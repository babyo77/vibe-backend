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
  const session =
    req.cookies.vibeIdR || req.headers.authorization?.split(" ")[1];

  if (session) {
    const decoded: any = jwt.verify(session, process.env.JWT_SECRET || "");
    if (decoded) {
      return res.status(200).send("Already Logged in");
    }
  }

  const { token } = req.body;

  if (!token) throw new ApiError("Gotch u", 403);

  const verify = await admin.auth().verifyIdToken(token);

  if (!verify) {
    throw new ApiError("Invalid token 🤡", 403);
  }

  const isAlready = await User.findOne({ email: verify.email }).select("_id");
  if (isAlready) {
    return setJWTTokens(res, isAlready);
  } else {
    if (!verify.name || !verify.email || !verify.picture)
      throw new ApiError("Invalid data", 403);
    const user = await User.create({
      username: verify.email
        ?.split("@gmail.com")[0]
        ?.replace(/[^a-zA-Z0-9]/g, ""),
      name: verify.name,
      email: verify.email,
      imageUrl: verify.picture,
    });

    if (user) {
      return setJWTTokens(res, user);
    } else {
      throw new ApiError("Unable to create user", 500);
    }
  }
};

export const setJWTTokens = (
  res: Response,
  saved: any,
  redirectUrl: string | null = null
): any => {
  const accessToken = jwt.sign({ userId: saved._id }, jwt_secret, {
    expiresIn: "7d",
  });

  VibeCache.del(saved._id.toString());
  res.cookie("vibeIdR", accessToken, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  if (redirectUrl) {
    return res.redirect(redirectUrl + "&vibe_token=" + accessToken);
  }
  return res.json({ token: accessToken });
};
