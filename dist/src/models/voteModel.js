"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const voteSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    roomId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Room",
        required: true,
    },
    queueId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Queue",
        required: true,
    },
}, { timestamps: true });
const Vote = ((_a = mongoose_1.default.models) === null || _a === void 0 ? void 0 : _a.Vote) || mongoose_1.default.model("Vote", voteSchema);
exports.default = Vote;
