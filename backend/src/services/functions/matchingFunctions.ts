// src/services/functions/matchingFunctions.ts
import {
  BattleRules,
  PlayerData,
  RoomData,
  MatchResult,
  BattleLog,
  BattleData,
} from "../../shared/types";
import { BattleRoomIds, DATABASE_PATHS } from "../../shared/database-paths";
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
export const addToWaitingList = async (ids: BattleRoomIds) => {
  const waitingData = {
    ids: { roomId: ids.roomId, battleRoomId: ids.battleRoomId },
    timeWaiting: Date.now(),
  };
  await waitingPlayersRef.push(waitingData);
  console.log(`${ids} が待機リストに追加されました。`);
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
export const getNextRoomIdFromWaitingList =
  async (): Promise<BattleRoomIds | null> => {
    let ids: BattleRoomIds | null = null;

    try {
      const result = await waitingPlayersRef.transaction((waitingPlayers) => {
        if (waitingPlayers) {
          const opponentKey = Object.keys(waitingPlayers)[0];
          const opponent = waitingPlayers[opponentKey];
          ids = opponent.ids;

          if (ids) {
            delete waitingPlayers[opponentKey];
            return waitingPlayers;
          }
        }
        return waitingPlayers;
      });

      return result.committed ? ids : null;
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
  //RoomDataの作成
  const roomId = (await db.ref(DATABASE_PATHS.route_rooms).push()
    .key) as string;

  const roomData: RoomData = {
    roomId,
    status: "waiting",
    hostId: player.id,
    players: [],
    battleData: [],
  };

  await db.ref(DATABASE_PATHS.room(roomId)).set(roomData);
  await db.ref(DATABASE_PATHS.players(roomId)).push(player);
  console.log(`新しいルーム ${roomId} が作成されました。`);

  return roomId;
};

/**
 * 新しいバトルルームを作成
 * @param player プレイヤーデータ
 * @param roomId ルームID
 * @returns 新しいバトルルームID
 */
const createBattleRoom = async (
  player: PlayerData,
  roomId: string
): Promise<string> => {
  //BattleDataの作成
  const battleRoomId = (await db.ref(DATABASE_PATHS.battleData(roomId)).push()
    .key) as string;
  const newBattleLog: BattleLog = {
    phase: "waiting",
    currentTurn: 0,
    messages: [],
    activePlayerId: player.id,
    submitAnswer: [],
    battleResult: [],
    timeStamps: { start: Date.now(), end: 0 },
  };

  const newBattleRules: BattleRules = {
    maxTurn: 4,
    battleType: "Single",
    oneTurnTime: 60,
    topic: "",
  };

  const newBattleData: BattleData = {
    ids: {
      roomId: roomId,
      battleRoomId: battleRoomId,
    },
    phase: "waiting",
    hostId: player.id,
    players: [],
    battleRules: newBattleRules,
    battleLog: newBattleLog,
    winnerId: null,
    status: "waiting",
  };

  await db
    .ref(DATABASE_PATHS.battleData(roomId))
    .child(battleRoomId)
    .set(newBattleData);
  await db
    .ref(
      DATABASE_PATHS.battlePlayers({
        roomId: roomId,
        battleRoomId: battleRoomId,
      })
    )
    .push(player);

  console.log(`新しいバトルルーム ${battleRoomId} が作成されました。`);

  return battleRoomId;
};

/**
 * プレイヤーを既存のルームに参加させる
 * @param roomId ルームID
 * @param player プレイヤーデータ
 * @returns 成功した場合はtrue
 */
const joinRandomRoom = async (
  ids: BattleRoomIds,
  player: PlayerData
): Promise<boolean> => {
  console.log(`joinRoom: ${ids}, Player: ${player.name}`);

  try {
    // await db.ref(DATABASE_PATHS.phase(roomId)).set("chat");
    await db.ref(DATABASE_PATHS.players(ids.roomId)).push(player);
    await db.ref(DATABASE_PATHS.battlePlayers(ids)).push(player);
    await db.ref(DATABASE_PATHS.status(ids)).set("matched");
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
    const player = request.data as PlayerData;

    const ids = await getNextRoomIdFromWaitingList();

    if (ids && (await joinRandomRoom(ids, player))) {
      console.log(`入室成功: roomId ${ids}`);
      return { ids, startBattle: true, message: "Match successful" };
    }

    if (ids) {
      await removeRoom(ids.roomId);
    }

    const newRoomId = await createRoom(player);
    const newBattleRoomId = await createBattleRoom(player, newRoomId);

    const newIds = { roomId: newRoomId, battleRoomId: newBattleRoomId };
    await addToWaitingList(newIds);

    return {
      ids: newIds,
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
