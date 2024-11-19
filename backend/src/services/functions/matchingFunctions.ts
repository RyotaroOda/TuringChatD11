// src/services/functions/matchingFunctions.ts
import {
  BattleConfig,
  PlayerData,
  RoomData,
  MatchResult,
  BattleLog,
} from "../../shared/types";
import { DATABASE_PATHS } from "../../shared/database-paths";
import { db } from "../firebase_b";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { generateTopic } from "../chatGPT_b";

//#region Utility Functions

/**
 * 認証を確認
 * @param playerId プレイヤーID
 * @returns プレイヤーID
 * @throws 認証エラー
 */
const authCheck = (playerId: string): string => {
  if (!playerId) {
    throw new HttpsError("unauthenticated", "認証が必要です");
  }
  return playerId;
};

//#endregion

//#region Waiting List Management

const waitingPlayersRef = db.ref(DATABASE_PATHS.waitingPlayers);

/**
 * プレイヤーを待機リストに追加
 * @param playerId プレイヤーID
 * @param roomId ルームID
 */
export const addToWaitingList = async (playerId: string, roomId: string) => {
  const waitingData = { id: playerId, roomId, timeWaiting: Date.now() };
  await waitingPlayersRef.child(playerId).set(waitingData);
  console.log(`プレイヤー ${playerId} が待機リストに追加されました。`);
};

/**
 * プレイヤーを待機リストから削除
 * @param playerId プレイヤーID
 */
export const removeFromWaitingList = async (playerId: string) => {
  await waitingPlayersRef.child(playerId).remove();
  console.log(`プレイヤー ${playerId} が待機リストから削除されました。`);
};

/**
 * 待機リストから次のプレイヤーを取得し、roomIdを返す
 * @returns ルームIDまたはnull
 */
export const getNextRoomIdFromWaitingList = async (): Promise<
  string | null
> => {
  let roomId: string | null = null;

  try {
    const result = await waitingPlayersRef.transaction((waitingPlayers) => {
      if (waitingPlayers) {
        const opponentKey = Object.keys(waitingPlayers)[0];
        const opponent = waitingPlayers[opponentKey];
        roomId = opponent.roomId;

        if (roomId) {
          delete waitingPlayers[opponentKey];
          return waitingPlayers;
        }
      }
      return waitingPlayers;
    });

    return result.committed ? roomId : null;
  } catch (error) {
    console.error("待機リストからroomIdの取得に失敗しました:", error);
    throw new Error("待機リストからroomIdの取得に失敗しました");
  }
};

//#endregion

//#region Room Management

/**
 * 新しいルームを作成
 * @param player プレイヤーデータ
 * @returns 新しいルームID
 */
const createRoom = async (player: PlayerData): Promise<string> => {
  const roomId = db.ref(DATABASE_PATHS.route_rooms).push().key as string;

  const newBattleLog: BattleLog = {
    phase: "waiting",
    currentTurn: 0,
    messages: [],
    activePlayerId: player.id,
    submitAnswer: [],
    battleResult: [],
    timeStamps: { start: Date.now(), end: 0 },
  };

  const newBattleConfig: BattleConfig = {
    maxTurn: 4,
    battleType: "Single",
    oneTurnTime: 60,
    topic: (await generateTopic()) ?? "default topic",
  };

  const roomData: RoomData = {
    roomId,
    status: "waiting",
    hostId: player.id,
    players: [],
    battleConfig: newBattleConfig,
    battleLog: newBattleLog,
  };

  await db.ref(DATABASE_PATHS.room(roomId)).set(roomData);
  await db.ref(DATABASE_PATHS.players(roomId)).push(player);
  console.log(`新しいルーム ${roomId} が作成されました。`);

  return roomId;
};

/**
 * プレイヤーを既存のルームに参加させる
 * @param roomId ルームID
 * @param player プレイヤーデータ
 * @returns 成功した場合はtrue
 */
const joinRoom = async (
  roomId: string,
  player: PlayerData
): Promise<boolean> => {
  console.log(`joinRoom: ${roomId}, Player: ${player.name}`);

  try {
    await db.ref(DATABASE_PATHS.phase(roomId)).set("chat");
    await db.ref(DATABASE_PATHS.players(roomId)).push(player);
    await db.ref(DATABASE_PATHS.status(roomId)).set("matched");
    return true;
  } catch (error) {
    console.error("ルームへの参加中に競合が発生しました:", error);
    return false;
  }
};

/**
 * ルームを削除
 * @param roomId ルームID
 */
const removeRoom = async (roomId: string) => {
  await db.ref(DATABASE_PATHS.room(roomId)).remove();
  console.log(`ルーム ${roomId} が削除されました。`);
};

//#endregion

//#region Matchmaking

/**
 * マッチングリクエストを処理するクラウド関数
 */
export const requestMatchFunction = onCall(
  async (request): Promise<MatchResult> => {
    const playerId = authCheck(request.auth?.uid ?? "");
    const player = request.data as PlayerData;

    const roomId = await getNextRoomIdFromWaitingList();

    if (roomId && (await joinRoom(roomId, player))) {
      console.log(`入室成功: roomId ${roomId}`);
      return { roomId, startBattle: true, message: "Match successful" };
    }

    if (roomId) {
      await removeRoom(roomId);
    }

    const newRoomId = await createRoom(player);
    await addToWaitingList(playerId, newRoomId);

    return {
      roomId: newRoomId,
      startBattle: false,
      message: "Waiting for an opponent...",
    };
  }
);

/**
 * マッチングリクエストをキャンセルするクラウド関数
 */
export const cancelMatchFunction = onCall(async (request) => {
  const playerId = authCheck(request.auth?.uid ?? "");

  await removeFromWaitingList(playerId);

  const playerSnapshot = await db
    .ref(`${waitingPlayersRef}/${playerId}`)
    .once("value");
  const playerData = playerSnapshot.val();

  if (playerData?.roomId) {
    await removeRoom(playerData.roomId);
  }
});

//#endregion

/**
 * テスト用のクラウド関数
 */
export const testFunction = onCall((request) => {
  return {
    message: "Test function executed successfully!",
    text: "Test test test",
    data: 999,
  };
});
