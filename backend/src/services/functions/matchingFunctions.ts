// src/services/functions/matchingFunctions.ts
import {
  BattleRules,
  PlayerData,
  RoomData,
  MatchResult,
  ChatData,
  BattleRoomData,
} from "../../shared/types";
import { DATABASE_PATHS } from "../../shared/database-paths";
import { db } from "../firebase_b";
import { onCall, HttpsError } from "firebase-functions/v2/https";

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
export const addToWaitingList = async (playerId: string, battleId: string) => {
  const waitingData = {
    [playerId]: {
      battleId: battleId,
      timeWaiting: Date.now(),
    },
  };
  await waitingPlayersRef.set(waitingData);
  console.log(`${battleId} が待機リストに追加されました。`);
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
  let battleId: string | null = null;

  try {
    const result = await waitingPlayersRef.transaction((waitingPlayers) => {
      if (waitingPlayers) {
        const opponentKey = Object.keys(waitingPlayers)[0];
        const opponent = waitingPlayers[opponentKey];
        battleId = opponent.battleId;

        if (battleId) {
          delete waitingPlayers[opponentKey];
          return waitingPlayers;
        }
      }
      return waitingPlayers;
    });

    return result.committed ? battleId : null;
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
  await db.ref(DATABASE_PATHS.players(roomId)).child(player.id).set(player);
  console.log(`新しいルーム ${roomId} が作成されました。`);

  return roomId;
};

/**
 * 新しいバトルルームを作成
 * @param player プレイヤーデータ
 * @param roomId ルームID
 * @returns 新しいバトルルームID
 */
const createBattleRoom = async (player: PlayerData): Promise<string> => {
  //BattleDataの作成
  const battleId = (await db.ref(DATABASE_PATHS.route_battles).push()
    .key) as string;
  const newChatData: ChatData = {
    currentTurn: 0,
    activePlayerId: player.id,
    messages: [],
  };

  const newBattleRules: BattleRules = {
    maxTurn: 4,
    battleType: "Single",
    oneTurnTime: 60,
    topic: "",
  };

  const newBattleData: BattleRoomData = {
    battleId: battleId,
    hostId: player.id,
    players: [],
    battleRule: newBattleRules,
    chatData: newChatData,
    status: "waiting",
    submitAnswer: [],
    battleResult: [],
    timestamps: {
      start: 0,
      end: 0,
    },
  };

  await db.ref(DATABASE_PATHS.battle(battleId)).set(newBattleData);
  await db
    .ref(DATABASE_PATHS.battlePlayers(battleId))
    .child(player.id)
    .set(player);

  console.log(`新しいバトルルーム ${battleId} が作成されました。`);

  return battleId;
};

/**
 * プレイヤーを既存のルームに参加させる
 * @param roomId ルームID
 * @param player プレイヤーデータ
 * @returns 成功した場合はtrue
 */
const joinRandomRoom = async (
  battleId: string,
  player: PlayerData
): Promise<boolean> => {
  console.log(`joinRoom: ${battleId}, Player: ${player.name}`);

  try {
    // await db.ref(DATABASE_PATHS.phase(roomId)).set("chat");
    await db.ref(DATABASE_PATHS.players(battleId)).child(player.id).set(player);
    await db
      .ref(DATABASE_PATHS.battlePlayers(battleId))
      .child(player.id)
      .set(player);
    await db.ref(DATABASE_PATHS.status(battleId)).set("matched");
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

const removeBattleRoom = async (battleId: string) => {
  await db.ref(DATABASE_PATHS.battleRoom(battleId)).remove();
  console.log(`バトルルーム ${battleId} が削除されました。`);
};

//#endregion

//#region Matchmaking

/**
 * マッチングリクエストを処理するクラウド関数
 */
export const requestMatchFunction = onCall(
  async (request): Promise<MatchResult> => {
    const player = request.data as PlayerData;

    const battleId = await getNextRoomIdFromWaitingList();

    if (battleId && (await joinRandomRoom(battleId, player))) {
      console.log(`入室成功: roomId ${battleId}`);
      return { battleId, startBattle: true, message: "Match successful" };
    }

    if (battleId) {
      await removeRoom(battleId);
    }

    const newBattleId = await createBattleRoom(player);

    await addToWaitingList(player.id, newBattleId);

    return {
      battleId: newBattleId,
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
  const playerSnapshot = await db
    .ref(`${waitingPlayersRef}/${playerId}`)
    .once("value");
  const playerData = playerSnapshot.val();

  if (playerData?.roomId) {
    await removeRoom(playerData.roomId);
  }

  await removeFromWaitingList(playerId);
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
