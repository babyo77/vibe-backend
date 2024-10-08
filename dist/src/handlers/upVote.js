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
exports.default = upVote;
const utils_1 = require("../lib/utils");
const voteModel_1 = __importDefault(require("../models/voteModel"));
const error_1 = require("./error");
function upVote(socket, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { roomInfo, userId } = socket;
            if (!roomInfo)
                return;
            if (!data) {
                const votes = yield (0, utils_1.getVotesArray)(roomInfo._id, userId);
                const queue = yield (0, utils_1.getSongsWithVoteCounts)(roomInfo._id);
                socket.emit("votes", { votes, queue });
                return;
            }
            if (!data.queueId)
                return;
            const isAlreadyVoted = yield voteModel_1.default.findOne({
                roomId: roomInfo._id,
                userId,
                queueId: data.queueId,
            });
            if (!isAlreadyVoted) {
                yield voteModel_1.default.create({
                    roomId: roomInfo._id,
                    userId,
                    queueId: data.queueId,
                });
            }
            else {
                yield voteModel_1.default.deleteOne({
                    roomId: roomInfo._id,
                    userId,
                    queueId: data.queueId,
                });
            }
            const votes = yield (0, utils_1.getVotesArray)(roomInfo._id, userId);
            const queue = yield (0, utils_1.getSongsWithVoteCounts)(roomInfo._id);
            socket.emit("votes", { votes, queue });
            socket.to(roomInfo.roomId).emit("getVotes");
        }
        catch (error) {
            console.log("UPVOTE ERROR:", error.message);
            (0, error_1.errorHandler)(socket, error.message || "An unexpected error occurred");
        }
    });
}
