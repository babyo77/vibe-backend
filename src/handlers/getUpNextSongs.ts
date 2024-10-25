// import { CustomSocket } from "../../types";
// import { getMostVotedSongs, getSongsWithVoteCounts } from "../lib/utils";
// import { errorHandler } from "./error";

// export async function getUpNextSongs(socket: CustomSocket) {
//   try {
//     const { roomInfo, userId } = socket;
//     if (!roomInfo || !userId) throw new Error("Login Required");

//     // Get the list of most voted songs
//     const getNextSongs = await getMostVotedSongs(roomInfo._id);

//     // Initialize an array to hold the processed songs
//     const upNextSongs = [];

//     // Loop through the songs and process them with vote counts
//     for (const song of getNextSongs) {
//       const processedSong = (
//         await getSongsWithVoteCounts(
//           roomInfo._id,
//           userId,
//           false,
//           song.order,
//           true
//         )
//       )[0];
//       upNextSongs.push(processedSong);
//     }

//     // Emit the processed list of songs
//     socket.emit("upNextSongs", upNextSongs);
//   } catch (error: any) {
//     // Handle any errors that occur
//     errorHandler(socket, error.message);
//   }
// }
