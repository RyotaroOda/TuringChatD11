//src/services/functions/matching_f_b.ts
// import * as functions from "firebase-functions";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import {
  requestMatch,
  findMatch,
  removePlayerFromWaitingList,
} from "..//matching_b";

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
export const testFunction = onCall((request) => {
  // テスト用にシンプルなレスポンスを返す
  return { message: "Test function executed successfully!" };
});

// マッチングリクエストを処理するFirebase Function
export const requestMatchFunction = onCall(async (request) => {
  console.log("requestMatchFunction sever start");
  const playerId = request.auth?.uid; // 認証情報からユーザーIDを取得
  const playerRating = request.data.rating; // クライアントから送られたデータを取得

  if (!playerId) {
    throw new HttpsError("unauthenticated", "認証が必要です");
  }

  await requestMatch(playerId, playerRating); // プレイヤーを待機リストに追加
  const matchResult = await findMatch(playerId, playerRating); // マッチング処理を実行

  return matchResult;
});

// プレイヤーを待機リストから削除するFirebase Function
export const cancelMatchFunction = onCall(async (request) => {
  const playerId = request.auth?.uid; // 認証情報からユーザーIDを取得

  if (!playerId) {
    throw new HttpsError("unauthenticated", "認証が必要です");
  }

  await removePlayerFromWaitingList(playerId); // 待機リストから削除
  return { message: "マッチングがキャンセルされました" };
});
