//src/services/functions/matchingFunctions.ts
import {
  BattleConfig,
  PlayerData,
  RoomData,
  MatchResult,
  BattleLog,
} from "shared/dist/types";
import { db } from "../firebase_b";
import { onCall, HttpsError } from "firebase-functions/v2/https";

//バトル設定
const battleConfig: BattleConfig = {
  maxTurn: 2 * 2,
  battleType: "Single",
  oneTurnTime: 60,
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

const authCheck = (playerId: string) => {
  if (!playerId) {
    throw new HttpsError("unauthenticated", "認証が必要です");
  }
  return playerId;
};

//#region waitingPlayers
const waitingPlayersRef = db.ref("randomMatching/waitingPlayers/");

// プレイヤーを待機リストに追加する関数
export const addToWaitingList = async (playerId: string, roomId: string) => {
  const waitingData = { id: playerId, roomId, timeWaiting: Date.now() };
  await waitingPlayersRef.child(playerId).set(waitingData);
  console.log(`プレイヤー ${playerId} が待機リストに追加されました。`);
};

// 待機リストからプレイヤーを削除する関数
export const removeFromWaitingList = async (playerId: string) => {
  await waitingPlayersRef.child(playerId).remove();
  console.log(`プレイヤー ${playerId} が待機リストから削除されました。`);
};

// トランザクションを使用して待機リストから次のプレイヤーを取得し、roomIdを返す関数
export const getNextRoomIdFromWaitingList = async (): Promise<
  string | null
> => {
  let roomId: string | null = null;
  try {
    const result = await waitingPlayersRef.transaction((waitingPlayers) => {
      if (waitingPlayers) {
        const opponentKey = Object.keys(waitingPlayers)[0]; // 最初のプレイヤーを取得
        const opponent = waitingPlayers[opponentKey];
        roomId = opponent.roomId;
        if (roomId) {
          // 待機リストからプレイヤーを削除
          delete waitingPlayers[opponentKey];
          return waitingPlayers; // 更新された待機リストを返す
        }
      }
      return waitingPlayers; // プレイヤーがいない場合は空文字列を返す
    });
    // トランザクションがコミットされ、プレイヤーが取得できた場合
    if (result.committed) {
      return roomId;
    }
    console.log("null");
    return null; // プレイヤーがいない、または取得できなかった場合
  } catch (error) {
    console.error("トランザクションのエラー:", error);
    throw new Error("待機リストからroomIdの取得に失敗しました");
  }
};

//#endregion

//#region rooms
const createRoom = async (player: PlayerData) => {
  const roomId = db.ref("rooms").push().key as string;

  const newBattleLog: BattleLog = {
    phase: "waiting",
    currentTurn: 0,
    messages: [],
    activePlayerId: "player.id",
    submitAnswer: [],
    battleResult: [],
  };

  const roomData: RoomData = {
    roomId: roomId,
    status: "waiting",
    players: [player],
    battleConfig: battleConfig,
    battleLog: newBattleLog,
  };

  // ルーム情報をデータベースに保存
  await db.ref(`rooms/${roomId}`).set(roomData);
  console.log(`新しいルーム ${roomId} が作成されました。`);
  return roomId;
};

// //同時に複数のクライアントが同じデータにアクセスしない場合
// const joinRoom = async (roomId: string, player: PlayerData) => {
//   const roomDataSnapshot = await db.ref(`rooms/${roomId}`).once("value");
//   const roomData = roomDataSnapshot.val();

//   if (roomData && roomData.player2) {
//     throw new HttpsError("already-exists", "既にプレイヤー2が存在します");
//   }

//   // 明示的にセットし、データをデータベースに反映
//   await db.ref(`rooms/${roomId}`).set({
//     ...roomData, // 既存のroomDataを維持
//     player2: player, // player2を追加
//   });
// };

const joinRoom = async (
  roomId: string,
  player: PlayerData
): Promise<Boolean> => {
  console.log("joinRoom", roomId, player);
  // 現在のメッセージの数を取得して、次のインデックスを決定する
  const snapshot = await db.ref(`rooms/${roomId}/players`).get;
  console.log("snapshot", snapshot);
  const playerCount = snapshot ? snapshot.length : 0; // メッセージの数を取得
  console.log("playerCount", playerCount);

  try {
    await db.ref(`rooms/${roomId}/players`).push(player);
    await db.ref(`rooms/${roomId}/status`).set("playing"); //TODO: battleTypeがSingleの場合のみ
    await db.ref(`rooms/${roomId}/battleLog/phase`).set("chat");
    return true;
    //TODO: トランザクションを使って安全にデータを更新する
    // // トランザクションを使用してルームに参加する
    // const result = await db.ref(`rooms/${roomId}`).transaction((roomData) => {
    //   if (roomData) {
    //     console.log("roomData", roomData);
    //     if (roomData.player2) {
    //       console.log("既にプレイヤー2が存在します", roomData.player2);
    //       return roomData; // 既にplayer2がいる場合、そのまま返す
    //     }
    //     roomData.player2 = player; // player2を追加
    //     return roomData; // 更新したデータを返す
    //   } else {
    //     console.log("ルームが存在しません");
    //     return; // ルームが存在しない場合は何も返さない
    //   }
    // });

    // // トランザクションが成功し、データがコミットされたか確認
    // if (result.committed) {
    //   console.log("トランザクション成功: ", result.snapshot.val());
    //   return true;
    // }

    // // コミットされなかった場合
    // console.log(
    //   "データの書き込みに失敗しました。result",
    //   result.snapshot.val()
    // );
    // return false;
  } catch (error) {
    console.log("競合が発生しました。", error);
    return false;
  }
};

const removeRoom = async (roomId: string) => {
  await db.ref(`rooms/${roomId}`).remove();
};

//#endregion

export const requestMatchFunction = onCall(
  async (request): Promise<MatchResult> => {
    const playerId = authCheck(request.auth?.uid ?? ""); // マッチング処理を実行
    const player = request.data as PlayerData;

    // トランザクションを使って安全に待機リストから次のプレイヤーを取得
    const roomId = await getNextRoomIdFromWaitingList();

    // マッチング相手が見つかった場合
    if (roomId && (await joinRoom(roomId, player))) {
      // マッチング相手のルームに参加
      console.log(`入室に成功しました。roomId: ${roomId}`);
      return {
        roomId: roomId,
        startBattle: true,
        message: "success to match",
      };
    }
    if (roomId) {
      removeRoom(roomId);
    }

    // マッチング相手がいなかった場合、新しいルームを作成
    const newRoomId = await createRoom(player);

    // 待機リストにプレイヤーを追加
    await addToWaitingList(playerId, newRoomId);

    return {
      roomId: newRoomId,
      startBattle: false,
      message: "Waiting for an opponent...",
    };
  }
);

// プレイヤーを待機リストから削除するFirebase Function
export const cancelMatchFunction = onCall(async (request) => {
  const playerId = authCheck(request.auth?.uid ?? "");
  removeFromWaitingList(playerId);
  // 自分が作ったルームも削除
  const playerSnapshot = await db
    .ref(`${waitingPlayersRef}/${playerId}`)
    .once("value");
  const playerData = playerSnapshot.val();

  if (playerData && playerData.roomId) {
    await db.ref(`rooms/${playerData.roomId}`).remove();
  }
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
    console.log("Firebase Functions 準備中...ちょっとまってね...");
  } catch (error) {
    console.error("Realtime Database の初期化中にエラーが発生しました:", error);
  }
};
// サーバー起動時に初期化処理を実行
initializeDatabase();
