"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelMatchFunction = exports.requestMatchFunction = void 0;
// src/functions/matching.ts
const functions = __importStar(require("firebase-functions"));
const matching_b_1 = require("../matching_b");
// マッチングリクエストを処理するFirebase Function
exports.requestMatchFunction = functions.https.onCall(async (request) => {
    const playerId = request.auth?.uid;
    const playerRating = request.data.rating;
    if (!playerId) {
        throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
    }
    await (0, matching_b_1.requestMatch)(playerId, playerRating); // プレイヤーを待機リストに追加
    const matchResult = await (0, matching_b_1.findMatch)(playerId, playerRating); // マッチング処理を実行
    return matchResult;
});
// プレイヤーを待機リストから削除するFirebase Function
exports.cancelMatchFunction = functions.https.onCall(async (request) => {
    const playerId = request.auth?.uid;
    if (!playerId) {
        throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
    }
    await (0, matching_b_1.removePlayerFromWaitingList)(playerId); // 待機リストから削除
    return { message: 'マッチングがキャンセルされました' };
});
