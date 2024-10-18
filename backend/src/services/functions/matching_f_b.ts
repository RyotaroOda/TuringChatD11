// src/functions/matching.ts
import * as functions from 'firebase-functions';
import { requestMatch, findMatch, removePlayerFromWaitingList } from '../matching_b';

// マッチングリクエストを処理するFirebase Function
export const requestMatchFunction = functions.https.onCall(async (request: functions.https.CallableRequest) => {
  const playerId = request.auth?.uid;
  const playerRating = request.data.rating;

  if (!playerId) {
    throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
  }

  await requestMatch(playerId, playerRating); // プレイヤーを待機リストに追加
  const matchResult = await findMatch(playerId, playerRating); // マッチング処理を実行

  return matchResult;
});

// プレイヤーを待機リストから削除するFirebase Function
export const cancelMatchFunction = functions.https.onCall(async (request: functions.https.CallableRequest) => {
  const playerId = request.auth?.uid;

  if (!playerId) {
    throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
  }

  await removePlayerFromWaitingList(playerId); // 待機リストから削除
  return { message: 'マッチングがキャンセルされました' };
});
