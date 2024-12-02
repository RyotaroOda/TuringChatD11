// frontend/src/services/firebase-realtime-database.ts
import { ref, push, get, onValue, off, update, set } from "firebase/database";
import { db, auth } from "./firebase_f.ts";
import {
  BattleResult,
  BattleRoomData,
  BotSetting,
  ChatData,
  Message,
  PlayerData,
  ResultData,
  SubmitAnswer,
} from "../shared/types.ts";
import { DATABASE_PATHS } from "../shared/database-paths.ts";
import { calculateResult } from "./firebase-functions-client.ts";

//#region HomeView

/** ルームのマッチング状況を監視
 * @param roomId ルームID
 * @param callback マッチング状況を返すコールバック
 * @returns リスナー解除関数
 */
export const onMatched = (
  battleId: string,
  callback: (isMatched: boolean) => void
) => {
  const statusRef = ref(db, DATABASE_PATHS.status(battleId));
  let kill = false;
  const listener = onValue(statusRef, (snapshot) => {
    const status = snapshot.val();
    console.log("現在のステータス:", status);

    if (status === "matched") {
      console.log("マッチング成功: リスナー解除");
      kill = true;
      callback(true);
    } else {
      callback(false);
    }
  });
  if (listener && kill) off(statusRef, "value", listener);

  return () => {
    console.log("onMatchedのリスナー解除");
    if (listener) off(statusRef, "value", listener);
  };
};

// /** ルームデータを取得
//  * @param roomId ルームID
//  * @returns ルームデータ
//  * @throws ルームが存在しない場合にエラー
//  */
// export const getRoomData = async (roomId: string): Promise<RoomData> => {
//   const roomRef = ref(db, DATABASE_PATHS.room(roomId));
//   const snapshot = await get(roomRef);

//   if (snapshot.exists()) {
//     const roomData = snapshot.val();
//     console.log("ルームデータを取得:", roomData);
//     return roomData as RoomData;
//   } else {
//     console.error("ルームが存在しません");
//     throw new Error("ルームが存在しません");
//   }
// };

/**バトルルームデータを取得
 * @param battleId バトルルームID
 * @returns バトルルームデータ
 * @throws バトルルームが存在しない場合にエラー
 */
export const getBattleRoomData = async (
  battleId: string
): Promise<BattleRoomData> => {
  const battleRoomRef = ref(db, DATABASE_PATHS.battleRoom(battleId));
  const snapshot = await get(battleRoomRef);

  if (snapshot.exists()) {
    const battleData = snapshot.val();
    console.log("ルームデータを取得:", battleData);
    return battleData as BattleRoomData;
  } else {
    console.error("ルームが存在しません");
    throw new Error("ルームが存在しません");
  }
};

//#endregion

//#region RoomView

/** 準備完了を通知
 * @param roomId ルームID
 * @param playerId プレイヤーID
 */
export const preparationComplete = async (
  battleId: string,
  playerId: string
) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const readyRef = ref(db, DATABASE_PATHS.ready(battleId, playerId));
  const playerData = { isReady: true };
  await update(readyRef, playerData);
  console.log("準備完了:", playerData);
};

/** プレイヤーの準備状況を監視
 * @param roomId ルームID
 * @param callback プレイヤーデータのリストを返すコールバック
 * @returns リスナー解除関数
 */
export const onPlayerPrepared = (
  battleId: string,
  callback: (players: PlayerData[]) => void
) => {
  const playersRef = ref(db, DATABASE_PATHS.battlePlayers(battleId));
  let kill = false;
  const listener = onValue(playersRef, (snapshot) => {
    const newPlayers = snapshot.val();
    console.log("プレイヤーデータが更新:", newPlayers);
    callback(newPlayers);

    if (
      newPlayers &&
      Object.values(newPlayers).every(
        (player) => (player as PlayerData).isReady
      )
    ) {
      console.log("全プレイヤー準備完了: リスナー解除");
      kill = true;
    }
  });
  if (listener && kill) off(playersRef, "value", listener);
  return () => {
    console.log("onPlayerPreparedのリスナー解除");
    if (listener) off(playersRef, "value", listener);
  };
};

/** バトルルールを更新
 * @param battleId バトルルームID
 * @param rules 更新するバトルルール
 */
export const updateBattleRules = async (battleId: string, rule: any) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const configRef = ref(db, DATABASE_PATHS.rule(battleId));
  await update(configRef, rule);
  console.log("update rule:", rule);
};

/** プライベートデータを更新
 * @param battleId バトルルームID
 * @param playerId プレイヤーID
 * @param isHuman 更新するプライベートデータ
 **/
export const updatePrivateBattleData = async (
  battleId: string,
  playerId: string,
  isHuman: boolean,
  bot: BotSetting | null
) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }
  const privateRef = ref(db, DATABASE_PATHS.battlePrivate(battleId, playerId));

  if (bot) {
    const data = { isHuman: isHuman, bot: bot };
    await set(privateRef, data);
    console.log("update rules:", data);
  } else {
    const data = { isHuman: isHuman };
    await set(privateRef, data);
    console.log("update rules:", data);
  }
};

/** プライベートデータを取得
 * @param battleId バトルルームID
 * @param playerId プレイヤーID
 * @returns プライベートデータ
 */
export const getPrivateBattleData = async (
  battleId: string,
  playerId: string
) => {
  const privateRef = ref(db, DATABASE_PATHS.battlePrivate(battleId, playerId));
  const snapshot = await get(privateRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    console.log("プライベートデータを取得:", data);
    return data;
  } else {
    console.error("プライベートデータが存在しません");
    return null;
  }
};

/**トピックの更新を監視
 * @param battleId バトルルームID
 * @param callback トピックを返すコールバック
 * @returns リスナー解除関数
 */
export const onGeneratedTopic = (
  battleId: string,
  callback: (topic: string) => void
) => {
  const configRef = ref(db, DATABASE_PATHS.chatData(battleId));
  let kill = false;
  // リスナー関数を名前付きで定義
  const listener = (snapshot) => {
    const val = snapshot.val() as ChatData;
    if (!val || !val.messages) return;
    const messages = Object.values(val.messages);
    const newTopic = messages[0].message;

    console.log("トピックが更新:", newTopic);
    callback(newTopic);

    // トピックが更新されたらリスナーを解除
    if (newTopic !== "") {
      console.log("トピックが生成されました: リスナー解除");
      kill = true;
    }
  };
  // リスナーを登録
  onValue(configRef, listener);
  if (listener && kill) off(configRef, "value", listener);

  // クリーンアップ用の関数を返す
  return () => {
    console.log("onGeneratedTopicのリスナー解除 return");
    off(configRef, "value", listener);
  };
};

//#endregion

//#region BattleView

/** バトルルームデータを更新
 * @param battleId バトルID
 * @param data 更新するバトルログデータ
 * */
export const updateBattleRoom = async (battleId: string, data: any) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  await update(ref(db, DATABASE_PATHS.battleRoom(battleId)), data);
  console.log("バトルログを更新:", data);
};

/** チャットデータの更新を監視
 * battleId バトルID
 * callback チャットデータを返すコールバック
 * @returns リスナー解除関数
 * */
export const onUpdateChatData = (
  battleId: string,
  callback: (data: any) => void
) => {
  let kill = false;
  const chatRef = ref(db, DATABASE_PATHS.chatData(battleId));
  const listener = onValue(chatRef, (snapshot) => {
    const newData = snapshot.val();
    console.log("On Battle Log 更新!!!:", newData);
    callback(newData);
    if (!newData) kill = true;
  });
  if (listener && kill) off(chatRef, "value", listener);

  return () => {
    console.log("onUpdateChatDataのリスナー解除");
    if (listener) off(chatRef, "value", listener);
  };
};

/** バトルログを取得
 * @param battleId バトルID
 * @returns バトルログデータ
 */
export const getChatData = async (battleId: string): Promise<ChatData> => {
  try {
    const logSnapshot = await get(ref(db, DATABASE_PATHS.chatData(battleId)));
    const logData = logSnapshot.val();
    console.log("バトルログを取得:", logData);
    return logData as ChatData;
  } catch (error) {
    console.error("バトルログ取得エラー:", error);
    throw error;
  }
};

/** メッセージを送信
 * @param roomId ルームID
 * @param message メッセージ内容
 * @param nextTurn 次のターン
 * @param activePlayerId アクティブプレイヤーのID
 */
export const addMessage = async (
  battleId: string,
  message: string,
  nextTurn: number,
  activePlayerId: string | null
) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const messageData: Message = {
    senderId: activePlayerId ? user.uid : "system",
    message,
    timestamp: Date.now(),
  };
  await push(
    ref(db, `${DATABASE_PATHS.chatData(battleId)}/messages`),
    messageData
  );
  if (activePlayerId) {
    //ターン更新
    const data = {
      currentTurn: nextTurn,
      activePlayerId: activePlayerId,
    };
    await update(ref(db, DATABASE_PATHS.chatData(battleId)), data);
  } else {
    const data = {
      currentTurn: nextTurn,
    };
    await update(ref(db, DATABASE_PATHS.chatData(battleId)), data);
  }
  console.log("メッセージ送信:", messageData);
};

/** 回答を送信
 * @param roomId ルームID
 * @param answer 提出された回答
 */
export const sendAnswer = async (battleId: string, answer: SubmitAnswer) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const answerRef = ref(db, DATABASE_PATHS.submittedAnswers(battleId));
  await push(answerRef, answer);
  console.log("回答送信:", answer);
};

/** 両プレイヤーの回答を確認
 * @param roomId ルームID
 */
export const checkAnswers = (battleId: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const answerRef = ref(db, DATABASE_PATHS.submittedAnswers(battleId));

  get(answerRef)
    .then((answersSnapshot) => {
      const answers = answersSnapshot.val();
      if (answers && Object.keys(answers).length === 2) {
        console.log("両プレイヤーの回答が揃いました:", answers);
        calculateResult(battleId);
      } else {
        onValue(answerRef, (snapshot) => {
          const updatedAnswers = snapshot.val();
          if (updatedAnswers && Object.keys(updatedAnswers).length === 2) {
            calculateResult(battleId);
            off(answerRef); // リスナー解除
            console.log("checkAnswersのリスナー解除");
          }
        });
      }
    })
    .catch((error) => {
      console.error("回答確認エラー:", error);
    });
};

/** バトル結果を監視
 * @param roomId ルームID
 * @param isHost ホストかどうか
 * @param callback バトル結果データを返すコールバック
 * @returns リスナー解除関数
 */
export const onResultUpdated = (
  battleId: string,
  isHost: boolean,
  callback: (players: ResultData | null) => void
) => {
  const resultRef = ref(db, DATABASE_PATHS.result(battleId));
  let kill = false;
  const listener = onValue(
    resultRef,
    (snapshot) => {
      const serverData = snapshot.val() as BattleResult;
      if (serverData) {
        console.log("バトル結果が更新:", serverData);
        const result: ResultData = {
          playerId: auth.currentUser?.uid || "",
          myAnswer: isHost ? serverData.answers[0] : serverData.answers[1],
          opponentAnswer: isHost
            ? serverData.answers[1]
            : serverData.answers[0],
          myCorrects: isHost ? serverData.corrects[0] : serverData.corrects[1],
          opponentCorrects: isHost
            ? serverData.corrects[1]
            : serverData.corrects[0],
          win: isHost
            ? serverData.scores[0] > serverData.scores[1]
              ? "win"
              : serverData.scores[0] < serverData.scores[1]
                ? "lose"
                : "draw"
            : serverData.scores[1] > serverData.scores[0]
              ? "win"
              : serverData.scores[1] < serverData.scores[0]
                ? "lose"
                : "draw",
          score: isHost ? serverData.scores[0] : serverData.scores[1],
          time: serverData.time,
        };
        callback(result);
        console.log("onResultUpdatedのリスナー解除:正常");
        kill = true;
      } else {
        console.log("バトル結果なし");
        callback(null);
      }
      if (listener && kill) off(resultRef, "value", listener);
    },
    (error) => {
      console.error("バトル結果監視エラー:", error);
      callback(null);
    }
  );

  return () => {
    console.log("onResultUpdatedのリスナー解除");
    if (listener) off(resultRef, "value", listener);
  };
};

//#endregion
