// import { CustomSocket } from "../../types";
// import { getSongsWithVoteCounts } from "../lib/utils";
// import { errorHandler } from "./error";

// export async function getQueueList(socket: CustomSocket) {
//   try {
//     const { roomInfo, userId } = socket;
//     if (!roomInfo || !userId) throw new Error("Login Required");
//     const queue = await getSongsWithVoteCounts(roomInfo._id, userId);

//     socket.emit("queueList", queue);
//   } catch (error: any) {
//     errorHandler(socket, error.message);
//   }
// }
