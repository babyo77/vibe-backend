import { ExtendedError } from "socket.io/dist/namespace";
import { CustomSocket } from "../../types";
import { getListener, getSongsWithVoteCounts } from "../lib/utils";

export async function handleGuestUser(
  socket: CustomSocket,
  next: (err?: ExtendedError) => void
) {
  try {
    const { roomInfo, progress, userId } = socket;
    if (!roomInfo) return;
    socket.join(roomInfo.roomId);
    if (!userId) {
      const [queue, listeners] = await Promise.all([
        await getSongsWithVoteCounts(roomInfo?._id, undefined, false),
        await getListener(roomInfo?._id),
      ]);

      socket.emit("joinedRoom", {});
      socket
        .to(roomInfo.roomId)
        .emit("userJoinedRoom", { user: { username: "someone" }, listeners });

      throw new Error(
        JSON.stringify({
          queue,
          listener: { ...listeners, totalUsers: listeners.totalUsers + 1 },
          progress,
          message: "Login required to interact",
        })
      );
    }
    next();
  } catch (error: any) {
    console.log("GUEST USER MIDDLEWARE ERROR:", error.message);
    if (error.message === "jwt malformed") return;
    return next(new Error(error?.message || "Invalid token"));
  }
}
