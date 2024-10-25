// import { Server } from "socket.io";
// import { CustomSocket } from "../../types";
// import { DefaultEventsMap } from "socket.io/dist/typed-events";
// import Room from "../models/roomModel";

// export async function handleLoop(
//   io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
//   socket: CustomSocket,
//   looped = false
// ) {
//   try {
//     const { roomInfo, role } = socket;
//     if (!roomInfo) return;
//     if (role === "admin") {
//       await Room.findByIdAndUpdate(roomInfo._id, {
//         looped: looped,
//       });
//       io.to(roomInfo.roomId).emit("loop", looped);
//     }
//   } catch (error) {
//     console.log("LOOP ERROR:", error);
//   }
// }
