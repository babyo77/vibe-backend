import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import {
  decryptObjectValues,
  GET_ROOM_LISTENERS_CACHE_KEY,
} from "../lib/utils";
import User from "../models/userModel";
import { ApiError } from "./apiError";
import { tnzara } from "../cache/cache";
import { VibeCacheDb } from "../cache/cache-db";


export const updateUser = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const data = decryptObjectValues(req.body) as {
    name: string;
    username: string;
  };
  const userId = req.userId;
  const roomId = req.cookies.room || req.headers.room;
  const socketId = req.headers.socket;
  if (!userId) throw new ApiError("Login required", 401);
  if (!roomId) throw new ApiError("RoomId is missing", 400);

  if (!data.username || !data.name)
    throw new ApiError(
      `Yo, both username and name are a must, no exceptions!`,
      400
    );

  const isValidUserName =
    /^[a-z0-9_]+$/.test(data.username) &&
    /[^_]+/.test(data.username) &&
    data.username === data.username.toLowerCase();

  if (!isValidUserName) {
    throw new ApiError(
      "No symbols, just lowercase & numbers. Keep it real, you're special.",
      400
    );
  }
  if (data.username.length <= 2 || data.name.length <= 2) {
    throw new ApiError(
      "Name & username need to be 3+ chars. Show us who you really are.",
      400
    );
  }
  if (data.name.length > 26) {
    throw new ApiError(
      "Name’s too extra! Max 25 chars, gotta keep it sharp.",
      400
    );
  }
  if (data.username.length > 26) {
    throw new ApiError(
      "Username’s too long! Max 25 chars, don’t lose the vibe.",
      400
    );
  }

  const isAlreadyUsernameExist = await User.findOne({
    username: data.username,
  }).select("_id");
  if (
    isAlreadyUsernameExist &&
    isAlreadyUsernameExist?._id.toString() !== userId
  ) {
    throw new ApiError("Deja vu! Username already taken", 409);
  }
  await User.findByIdAndUpdate(userId, {
    username: data.username.toLocaleLowerCase(),
    name: data.name,
  });
  VibeCacheDb[GET_ROOM_LISTENERS_CACHE_KEY(roomId)].update(
    {
      userId: {
        id: socketId,
      },
    },
    {
      userId: {
        username: data.username.toLocaleLowerCase(),
        name: data.name,
      },
    }
  );
  tnzara.del(userId + "userInfo");
  return res.status(204).send();
};
