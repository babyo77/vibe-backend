// import { Server } from "socket.io";
// import { CustomSocket } from "../../types";
// import Room from "../models/roomModel";
// import { errorHandler } from "./error";
// import { DefaultEventsMap } from "socket.io/dist/typed-events";

// export async function shuffle(
//   io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
//   socket: CustomSocket,
//   shu = false
// ) {
//   try {
//     const { roomInfo, role } = socket;

//     if (!roomInfo) throw new Error("Invalid room");
//     if (role !== "admin") throw new Error("Only admin can shuffle");

//     await Room.findByIdAndUpdate(roomInfo._id, {
//       shuffled: shu,
//     });
//     io.to(roomInfo.roomId).emit("shuffle", shu);
//   } catch (error: any) {
//     console.log("Failed to shuffle", error.message);
//     errorHandler(socket, error.message);
//   }
// }
