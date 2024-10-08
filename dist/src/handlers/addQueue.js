"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = addQueue;
const utils_1 = require("../lib/utils");
const queueModel_1 = __importDefault(require("../models/queueModel"));
const error_1 = require("./error");
function addQueue(socket, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { roomInfo, userId } = socket;
            if (!roomInfo)
                return;
            if (data) {
                const isAlready = yield queueModel_1.default.findOne({ songData: data });
                if (isAlready) {
                    throw new Error("Song already exists in queue");
                }
                const song = yield queueModel_1.default.create({
                    roomId: roomInfo._id,
                    songData: Object.assign(Object.assign({}, data), { addedBy: userId }),
                    playing: true,
                });
                yield queueModel_1.default.findByIdAndUpdate(song._id, {
                    songData: Object.assign(Object.assign({}, song.songData), { queueId: song._id.toString() }),
                });
            }
            const queue = yield (0, utils_1.getSongsWithVoteCounts)(roomInfo._id);
            if (queue) {
                socket.emit("songQueue", queue);
                if (data) {
                    socket.to(roomInfo.roomId).emit("songQueue", queue);
                }
            }
        }
        catch (error) {
            console.log("ADDING TO QUEUE ERROR:", error.message);
            (0, error_1.errorHandler)(socket, error.message || "An unexpected error occurred");
        }
    });
}
