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
exports.getVotesArray = exports.getSongsWithVoteCounts = exports.parseCookies = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const voteModel_1 = __importDefault(require("../models/voteModel"));
const queueModel_1 = __importDefault(require("../models/queueModel"));
const parseCookies = (cookieHeader) => {
    const cookies = {};
    if (!cookieHeader)
        return;
    cookieHeader.split(";").forEach((cookie) => {
        const [name, ...rest] = cookie.split("=");
        cookies[name.trim()] = decodeURIComponent(rest.join("="));
    });
    return cookies;
};
exports.parseCookies = parseCookies;
const getSongsWithVoteCounts = (roomId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const songsWithVoteCounts = yield queueModel_1.default.aggregate([
            {
                $match: { roomId: new mongoose_1.default.Types.ObjectId(roomId) }, // Match songs in the specified room
            },
            {
                $lookup: {
                    from: "votes", // Name of the votes collection
                    localField: "_id", // Field from the Queue collection
                    foreignField: "queueId", // Field from the Vote collection
                    as: "votes", // Alias for the resulting array of votes
                },
            },
            {
                $addFields: {
                    "songData.voteCount": { $size: "$votes" }, // Add voteCount directly to songData
                },
            },
            {
                $project: {
                    _id: 0, // Exclude the _id field from the result
                    songData: 1, // Include only the songData field
                },
            },
            {
                $replaceRoot: { newRoot: "$songData" }, // Replace the root with songData
            },
        ]);
        return songsWithVoteCounts; // Return only the array of songData
    }
    catch (error) {
        console.error("Error fetching songs with vote counts:", error);
        throw error; // Propagate the error for handling by the caller
    }
});
exports.getSongsWithVoteCounts = getSongsWithVoteCounts;
const getVotesArray = (roomId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        return;
    const votedArray = yield voteModel_1.default.find({ roomId: roomId, userId });
    return votedArray;
});
exports.getVotesArray = getVotesArray;
