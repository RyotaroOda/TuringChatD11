//src/services/functions/matching_f_b.ts
// import * as functions from "firebase-functions";
import {
  BattleConfig,
  BattleType,
  newBattleLog,
  PlayerData,
  RoomData,
  MatchResult,
} from "shared/dist/types";
import { db } from "../firebase_b";
import { onCall, HttpsError } from "firebase-functions/v2/https";

//バトル設定
const battleConfig: BattleConfig = {
  maxTurn: 6 * 2,
  battleType: BattleType.Single,
  oneTurnTime: 60,
};
const waitingPlayersRef = db.ref("randomMatching/waitingPlayers/");

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

const authCheck = (playerId: string) => {
  if (!playerId) {
    throw new HttpsError("unauthenticated", "認証が必要です");
  }
  return playerId;
};

const createRoom = async (player: PlayerData) => {
  const roomId = db.ref("rooms").push().key as string;

  const roomData: RoomData = {
    roomId: roomId,
    player1: player,
    battleConfig: battleConfig,
    battleLog: newBattleLog,
  };

  // ルーム情報をデータベースに保存
  await db.ref("rooms/" + roomId).set(roomData);
  return roomId;
};

const joinRoom = async (roomId: string, player: PlayerData) => {
  const roomSnapshot = await db.ref(`rooms/${roomId}`).once("value");
  const roomData = roomSnapshot.val();
  if (!roomData) {
    throw new HttpsError("not-found", "ルームが見つかりません");
  }
  if (roomData.player2) {
    throw new HttpsError("already-exists", "既にプレイヤー2が存在します");
  }
  await db.ref(`rooms/${roomId}/player2`).set(player);
};

// マッチングリクエストを処理するFirebase Function 引数:PlayerData
export const requestMatchFunction = onCall(
  async (request): Promise<MatchResult> => {
    const playerId = authCheck(request.auth?.uid ?? ""); // マッチング処理を実行
    const player = request.data as PlayerData;
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

      await joinRoom(roomId, player);

      return {
        roomId: roomId,
        startBattle: true,
        message: "success to match",
      }; // マッチング成功時にルームIDと相手のIDを返す
    }

    // マッチング相手が見つからなかった場合
    else {
      // 待機プレイヤーがいない場合、新しいルームを作成
      const roomId = await createRoom(player); // 新しいルームIDを生成

      // 待機リストにプレイヤーを追加（ルームIDも含む）
      const waitingData = { id: playerId, roomId, timeWaiting: Date.now() };
      await waitingPlayersRef.child(playerId).set(waitingData);

      return {
        roomId: roomId,
        startBattle: false,
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

// 初期化処理：Realtime Database の初期化
const initializeDatabase = async () => {
  try {
    // 初期化するデータ構造 (例：rooms, waitingPlayers などをクリア)
    const initialData = {
      rooms: null, // 全ルームデータを削除
      randomMatching: null, // 待機中のプレイヤーデータを削除
    };

    // Firebase Realtime Database に初期データを設定
    await db.ref().set(initialData);
    console.log("Realtime Database の初期化が完了しました。");
    console.log("Generating Functions...");
  } catch (error) {
    console.error("Realtime Database の初期化中にエラーが発生しました:", error);
  }
};
// サーバー起動時に初期化処理を実行
initializeDatabase();
