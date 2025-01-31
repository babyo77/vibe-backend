import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import admin from "../../firebase/firebase";
import { ApiError } from "./apiError";
import redisClient from "../cache/redis";

const jwt_secret = process.env.JWT_SECRET || "";
export const login = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const session = req.cookies.vibeIdR || req.headers.authorization;

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
    return await setJWTTokens(res, isAlready);
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
      return await setJWTTokens(res, user);
    } else {
      throw new ApiError("Unable to create user", 500);
    }
  }
};

export const setJWTTokens = async (
  res: Response,
  saved: any,
  redirectUrl: string | null = null
): Promise<any> => {
  const accessToken = jwt.sign({ userId: saved._id }, jwt_secret, {
    expiresIn: "30d",
  });

  await redisClient.del(saved._id.toString());

  const cookieExpirationDate = new Date();
  cookieExpirationDate.setDate(cookieExpirationDate.getDate() + 30);

  res.cookie("vibeIdR", accessToken, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    expires: cookieExpirationDate,
  });
  if (redirectUrl) {
    return res.redirect(redirectUrl + "&vibe_token=" + accessToken);
  }
  return res.json({ token: accessToken });
};
