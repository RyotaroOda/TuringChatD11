"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelMatchFunction = exports.requestMatchFunction = exports.testFunction = void 0;
//src/services/functions/matching_f_b.ts
// import * as functions from "firebase-functions";
const https_1 = require("firebase-functions/v2/https");
const matching_b_1 = require("..//matching_b");
// import { Request, Response } from "express";
// export const testFunction = onRequest(async (req: Request, res: Response) => {
//   // テキストパラメータを取得
//   const original = req.query.text as string;
//   if (!original) {
//     res.status(400).json({ result: "No text provided" });
//     return;
//   }
//   // メッセージが正常に書き込まれたことを通知
//   res.json({ result: `Message with ID: ${original} added.` });
// });
// テスト関数
exports.testFunction = (0, https_1.onCall)((request) => {
    // テスト用にシンプルなレスポンスを返す
    return { message: "Test function executed successfully!" };
});
// マッチングリクエストを処理するFirebase Function
exports.requestMatchFunction = (0, https_1.onCall)(async (request) => {
    console.log("requestMatchFunction sever start");
    const playerId = request.auth?.uid; // 認証情報からユーザーIDを取得
    const playerRating = request.data.rating; // クライアントから送られたデータを取得
    if (!playerId) {
        throw new https_1.HttpsError("unauthenticated", "認証が必要です");
    }
    await (0, matching_b_1.requestMatch)(playerId, playerRating); // プレイヤーを待機リストに追加
    const matchResult = await (0, matching_b_1.findMatch)(playerId, playerRating); // マッチング処理を実行
    return matchResult;
});
// プレイヤーを待機リストから削除するFirebase Function
exports.cancelMatchFunction = (0, https_1.onCall)(async (request) => {
    const playerId = request.auth?.uid; // 認証情報からユーザーIDを取得
    if (!playerId) {
        throw new https_1.HttpsError("unauthenticated", "認証が必要です");
    }
    await (0, matching_b_1.removePlayerFromWaitingList)(playerId); // 待機リストから削除
    return { message: "マッチングがキャンセルされました" };
});
