import { get, push, ref, runTransaction, set } from "firebase/database";
import { DATABASE_PATHS } from "../shared/database-paths.ts";
import { auth, db } from "./firebase_f.ts";
import {
  BattleRoomData,
  BattleRules,
  ChatData,
  MatchResult,
} from "../shared/types.ts";

export const matching = async (player): Promise<MatchResult> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }
  const userId = user.uid;
  const waitingRef = ref(db, DATABASE_PATHS.waitingPlayers);

  const snapshot = await get(waitingRef);

  if (snapshot.exists()) {
    const obj = snapshot.val();
    const firstKey = Object.keys(obj)[0];

    // waitingPlayers/firstKey に対してトランザクションを実行
    const battleIdRef = ref(db, `${DATABASE_PATHS.waitingPlayers}/${firstKey}`);

    let transactionResult = await runTransaction(battleIdRef, (currentData) => {
      if (currentData == null) {
        // 他のユーザーが既に取得済み
        return currentData;
      } else {
        // battleIdを取得し、waitingPlayersから削除
        return null;
      }
    });

    if (!transactionResult.committed) {
      // トランザクションがコミットされなかった場合
      console.log("Transaction not committed");
      // マッチングに失敗した場合、新しいルームを作成
    } else {
      // battleIdを取得
      const battleId = obj[firstKey].battleId;

      // battles/$battleId/players に対してトランザクションを実行
      const playersRef = ref(db, DATABASE_PATHS.players(battleId));

      let playerTransactionResult = await runTransaction(
        playersRef,
        (currentData) => {
          if (currentData == null) {
            // プレイヤーがいない場合、新規作成
            const data = {};
            data[userId] = player;
            return data;
          } else {
            const playerCount = Object.keys(currentData).length;
            if (playerCount >= 2) {
              console.log("バトルルームが満員です。");
              return; // トランザクションを中止
            } else {
              currentData[userId] = player;
              return currentData;
            }
          }
        }
      );

      if (playerTransactionResult.committed) {
        // プレイヤーの追加に成功
        console.log(`入室成功: roomId ${battleId}`);
        set(ref(db, DATABASE_PATHS.status(battleId)), "matched");
        push(ref(db, DATABASE_PATHS.battlePlayers(battleId)), player);
        return { battleId, startBattle: true, message: "Match successful" };
      } else {
        // バトルルームが満員の場合、新しいルームを作成
        console.log("Failed to join the battle room");
      }
    }
  }

  // waitingPlayersが存在しない、またはマッチングに失敗した場合、新しいルームを作成
  const newBattleId = (await push(ref(db, DATABASE_PATHS.route_battles)))
    .key as string;
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
    battleId: newBattleId,
    hostId: player.id,
    players: [],
    battleRule: newBattleRules,
    chatData: newChatData,
    status: "waiting",
    submitAnswer: [],
    battleResult: [],
    timestamps: {
      start: new Date(),
      end: new Date(),
    },
  };

  await set(ref(db, DATABASE_PATHS.battle(newBattleId)), newBattleData);
  await push(ref(db, DATABASE_PATHS.battlePlayers(newBattleId)), player);

  console.log(`新しいバトルルーム ${newBattleId} が作成されました。`);

  // waitingPlayers に自分を登録
  const userWaitingRef = ref(db, `${DATABASE_PATHS.waitingPlayers}/${userId}`);
  const waitingData = {
    battleId: newBattleId,
    timeWaiting: Date.now(),
  };
  await set(userWaitingRef, waitingData);

  return {
    battleId: newBattleId,
    startBattle: false,
    message: "Waiting for an opponent...",
  };
};
