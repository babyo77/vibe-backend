//used in new src
import { Server } from "socket.io";
import { CustomSocket } from "../../types";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { broadcast } from "../lib/customEmit";
import { decrypt } from "../lib/lock";

import { DELETE_USER_CACHED_QUEUE_LIST_FOR_ROOM_ID } from "../lib/utils";

export default async function upVote(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket,
  data?: any
) {
  try {
    const { roomInfo, userInfo } = socket;

    if (!roomInfo || !userInfo || !data) throw new Error("Login required");

    const value = decrypt(data) as { queueId: string };
    if (!value.queueId) {
      throw new Error("Queue ID is missing in the data.");
    }

    if (!value.queueId.startsWith("del")) {
      console.log(`User ${userInfo.id} is voting for queueId ${value.queueId}`);
      await Vote.findOneAndUpdate(
        {
          roomId: roomInfo._id,
          userId: userInfo.id,
          queueId: value.queueId,
        },
        {
          roomId: roomInfo._id,
          userId: userInfo.id,
          queueId: value.queueId,
        },
        { upsert: true }
      );
    } else {
      console.log(
        `User ${userInfo.id} is un-voting for queueId ${value.queueId}`
      );
      await Vote.deleteOne({
        roomId: roomInfo._id,
        userId: userInfo.id,
        queueId: value.queueId.replace("del", ""),
      });
    }
    DELETE_USER_CACHED_QUEUE_LIST_FOR_ROOM_ID(roomInfo.roomId);
    broadcast(io, roomInfo.roomId, "update", "update");
  } catch (error: any) {
    console.log("UPVOTE ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
