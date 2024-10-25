// import { ExtendedError } from "socket.io/dist/namespace";
// import { CustomSocket } from "../../types";
// import { getListener, getSongsWithVoteCounts } from "../lib/utils";

// export async function handleGuestUser(
//   socket: CustomSocket,
//   next: (err?: ExtendedError) => void
// ) {
//   try {
//     const { roomInfo, progress, userId } = socket;
//     if (!roomInfo) throw new Error("Invalid room");
//     socket.join(roomInfo.roomId);
//     if (!userId) {
//       const [queue, listeners] = await Promise.all([
//         await getSongsWithVoteCounts(roomInfo?._id, undefined),
//         await getListener(roomInfo?._id),
//       ]);

//       socket.emit("joinedRoom", {});
//       socket
//         .to(roomInfo.roomId)
//         .emit("userJoinedRoom", { user: { username: "someone" }, listeners });

//       throw new Error(
//         JSON.stringify({
//           queue,
//           listener: { ...listeners, totalUsers: listeners.totalUsers + 1 },
//           progress,
//           message: "Login required to interact",
//         })
//       );
//     }
//     return next();
//   } catch (error: any) {
//     if (error.message === "jwt malformed") return;
//     return next(new Error(error?.message || "Invalid token"));
//   }
// }
