//src/services/functions/matching_f_b.ts
// import * as functions from "firebase-functions";
import { MatchResult } from "../../../../shared/types";
import { db } from "../firebase_b";
import { onCall, HttpsError } from "firebase-functions/v2/https";

const waitingPlayersRef = db.ref("randomMatching/waitingPlayers/");

const authCheck = (playerId: string) => {
  if (!playerId) {
    throw new HttpsError("unauthenticated", "認証が必要です");
  }
  return playerId;
};

// テスト関数
export const testFunction = onCall((request) => {
  // テスト用にシンプルなレスポンスを返す
  const text = "Test test test";
  const data = 999;
  return {
    message: "Test function executed successfully!",
    text: text,
    data: data,
  };
});

// マッチングリクエストを処理するFirebase Function
export const requestMatchFunction = onCall(
  async (request): Promise<MatchResult> => {
    const playerId = authCheck(request.auth?.uid ?? ""); // マッチング処理を実行
    const snapshot = await waitingPlayersRef.once("value"); // Firebase Realtime Databaseから一度だけデータを取得
    const waitingPlayers = snapshot.val(); // 待機中のプレイヤーのデータを取得

    /// マッチング相手が見つかった場合
    if (waitingPlayers) {
      // 待機リストに他のプレイヤーがいる場合、そのプレイヤーのルームに参加
      const opponentKey = Object.keys(waitingPlayers)[0];
      const opponent = waitingPlayers[opponentKey];
      const roomId = opponent.roomId;

      // 待機リストから相手を削除
      await waitingPlayersRef.child(opponentKey).remove();

      // ルームにこのプレイヤーを追加（player2として）
      await db.ref(`rooms/${roomId}/player2`).set(playerId);

      return {
        roomId: roomId,
        opponentId: opponent.id,
        message: "success to match",
      }; // マッチング成功時にルームIDと相手のIDを返す
    }

    // マッチング相手が見つからなかった場合
    else {
      // 待機プレイヤーがいない場合、新しいルームを作成
      const roomId = db.ref("rooms").push().key as string; // 新しいルームIDを生成
      const roomData = {
        player1: playerId,
        createdAt: Date.now(),
      };

      // ルーム情報をデータベースに保存
      await db.ref("rooms/" + roomId).set(roomData);

      // 待機リストにプレイヤーを追加（ルームIDも含む）
      const playerData = { id: playerId, roomId, timeWaiting: Date.now() };
      await waitingPlayersRef.child(playerId).set(playerData);

      return {
        roomId: roomId,
        opponentId: "",
        message: "Waiting for an opponent...",
      };
    }
  }
);

// プレイヤーを待機リストから削除するFirebase Function
export const cancelMatchFunction = onCall(async (request) => {
  const playerId = authCheck(request.auth?.uid ?? "");
  const playerSnapshot = await db
    .ref(`${waitingPlayersRef}/${playerId}`)
    .once("value");
  const playerData = playerSnapshot.val();

  if (playerData && playerData.roomId) {
    // 自分が作ったルームも削除
    await db.ref(`rooms/${playerData.roomId}`).remove();
  }

  // 待機リストから自分を削除
  await waitingPlayersRef.remove();
  console.log("プレイヤーを待機リストから削除しました:", playerId);
});
