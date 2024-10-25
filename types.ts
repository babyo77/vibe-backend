import { Socket } from "socket.io";

export interface CustomSocket extends Socket {
  userInfo?: { id: string; role: "admin" | "listener" | string }; // Optional property
  roomInfo?: { roomId: string; _id: string; progress: number }; // Optional property
}

export interface prevSongT {
  prevSong: searchResults;
  roomId: string;
}

export interface nextSongT {
  nextSong: searchResults;
  callback?: boolean;
  mostVoted: boolean;
}

export interface joinRoom {
  userId: string;
  roomId: string | null;
}

export interface artists {
  id: number;
  name: string;
  role: string;
  image: [];
  type: "artist";
  url: string;
}

export interface downloadUrl {
  quality: string;
  url: string;
}

export interface searchResults {
  _id: string;
  id: string;
  name: string;
  order: number;
  artists: { primary: artists[] };
  image: downloadUrl[];
  downloadUrl: downloadUrl[];
  addedBy?: string;
  queueId?: string;
  voteCount: number;
}
