import { CustomSocket, searchResults } from "../../types";
import { getSongsWithVoteCounts, getVotesArray } from "../lib/utils";
import { errorHandler } from "../handlers/error";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Server } from "socket.io";
export async function songEnded(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket,
  data?: searchResults
) {
  try {
    const { roomInfo, userId, loop, shuffle } = socket;
    if (!data) return;
    if (!roomInfo || !userId) throw new Error("Login Required");

    await Vote.deleteMany({
      queueId: data.queueId,
      roomId: roomInfo._id,
    });
    await Queue.updateMany({ roomId: roomInfo._id }, { isPlaying: false });

    const queue = await getSongsWithVoteCounts(
      roomInfo._id,
      userId,
      true,
      shuffle
    );
    let nextSong = queue[0];
    const currentSongIndex = queue.findIndex((song) => song.id === data.id); // Assuming data.id contains the ID of the ended song

    // Handle edge cases (ended song not found in queue)
    if (currentSongIndex === -1) {
      nextSong = queue[0];
    }

    // Calculate the index of the next song
    const nextSongIndex = (currentSongIndex + 1) % queue.length; // Wrap around to the beginning if it's the last song

    // Get the next song based on the calculated index
    nextSong = queue[nextSongIndex];

    const votes = await getVotesArray(roomInfo._id, userId);
    const mostVotedSongCount = Math.max(...queue.map((song) => song.voteCount));
    nextSong =
      mostVotedSongCount == 0
        ? nextSong
        : queue.find((song) => song.voteCount === mostVotedSongCount);
    await Queue.updateMany({ roomId: roomInfo._id }, { isPlaying: false });
    await Queue.updateOne(
      {
        roomId: roomInfo._id,
        "songData.id": nextSong.id,
      },
      { isPlaying: true }
    );
    const payload = {
      play: loop ? data : nextSong,
      queue,
      votes,
    };

    io.to(roomInfo.roomId).emit("songEnded", payload);
  } catch (error: any) {
    console.log("SONGEND ERROR:", error.message);
    errorHandler(socket, error.message);
  }
}
