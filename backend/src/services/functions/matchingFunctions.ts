//src/services/functions/matchingFunctions.ts
import {
  BattleConfig,
  PlayerData,
  RoomData,
  MatchResult,
  BattleLog,
} from "shared/dist/types";
import { DATABASE_PATHS } from "shared/dist/database-paths";
import { db } from "../firebase_b";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { generateTopic } from "../chatGPT_b";

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
const waitingPlayersRef = db.ref(DATABASE_PATHS.waitingPlayers);

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
  const roomId = db.ref(DATABASE_PATHS.route_rooms).push().key as string;

  const newBattleLog: BattleLog = {
    phase: "waiting",
    currentTurn: 0,
    messages: [],
    activePlayerId: "player.id",
    submitAnswer: [],
    battleResult: [],
    timeStamps: { start: Date.now(), end: 0 },
  };

  const newBattleConfig: BattleConfig = {
    maxTurn: 1 * 2,
    battleType: "Single",
    oneTurnTime: 60,
    topic: (await generateTopic()) ?? "default topic",
  };

  const roomData: RoomData = {
    roomId: roomId,
    status: "waiting",
    hostId: player.id,
    players: [], //ここでplayerを入れるとIDが0になる
    battleConfig: newBattleConfig,
    battleLog: newBattleLog,
  };

  // ルーム情報をデータベースに保存
  await db.ref(DATABASE_PATHS.room(roomId)).set(roomData);
  await db.ref(DATABASE_PATHS.players(roomId)).push(player);
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
  console.log("joinRoom", roomId, player.name);
  // 現在のメッセージの数を取得して、次のインデックスを決定する
  const snapshot = await db.ref(DATABASE_PATHS.players(roomId)).get;
  const playerCount = snapshot ? snapshot.length : 0; // メッセージの数を取得
  console.log("playerCount", playerCount);
  try {
    await db.ref(DATABASE_PATHS.status(roomId)).set("playing");
    await db.ref(DATABASE_PATHS.phase(roomId)).set("chat");
    await db.ref(DATABASE_PATHS.players(roomId)).push(player); //最後に追加
    return true;
    //TODO: トランザクションを使って安全にデータを更新する
  } catch (error) {
    console.log("競合が発生しました。", error);
    return false;
  }
};

const removeRoom = async (roomId: string) => {
  await db.ref(DATABASE_PATHS.room(roomId)).remove();
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
    await db.ref(DATABASE_PATHS.room(playerData.roomId)).remove();
  }
});
