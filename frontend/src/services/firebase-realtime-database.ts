// frontend/src/services/firebase-realtime-database.ts
import {
  ref,
  push,
  get,
  onValue,
  onChildAdded,
  off,
  update,
} from "firebase/database";
import { db, auth } from "./firebase_f.ts";
import {
  BattleData,
  BattleLog,
  BattleResult,
  Message,
  PlayerData,
  ResultData,
  RoomData,
  SubmitAnswer,
} from "../shared/types.ts";
import { BattleRoomIds, DATABASE_PATHS } from "../shared/database-paths.ts";
import { calculateBattleResult } from "./firebase-functions-client.ts";

//#region HomeView

/**
 * ルームのマッチング状況を監視
 * @param roomId ルームID
 * @param callback マッチング状況を返すコールバック
 * @returns リスナー解除関数
 */
export const onMatched = (
  ids: BattleRoomIds,
  callback: (isMatched: boolean) => void
) => {
  const statusRef = ref(db, DATABASE_PATHS.status(ids));
  const listener = onValue(statusRef, (snapshot) => {
    const status = snapshot.val();
    console.log("現在のステータス:", status);

    if (status === "matched") {
      console.log("マッチング成功: リスナー解除");
      off(statusRef, "value", listener);
      callback(true);
    } else {
      callback(false);
    }
  });

  return () => {
    console.log("onMatchedのリスナー解除");
    off(statusRef, "value", listener);
  };
};

// /**
//  * ルームデータを取得
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

/**
 * ルームデータを取得
 * @param roomId ルームID
 * @returns ルームデータ
 * @throws ルームが存在しない場合にエラー
 */
export const getBattleRoomData = async (
  ids: BattleRoomIds
): Promise<BattleData> => {
  const battleRoomRef = ref(db, DATABASE_PATHS.battleRoom(ids));
  const snapshot = await get(battleRoomRef);

  if (snapshot.exists()) {
    const battleData = snapshot.val();
    console.log("ルームデータを取得:", battleData);
    return battleData as BattleData;
  } else {
    console.error("ルームが存在しません");
    throw new Error("ルームが存在しません");
  }
};

//#endregion

//#region RoomView

/**
 * 準備完了を通知
 * @param roomId ルームID
 * @param playerId プレイヤーID
 */
export const preparationComplete = async (
  ids: BattleRoomIds,
  playerId: string
) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const readyRef = ref(db, DATABASE_PATHS.ready(ids, playerId));
  const playerData = { isReady: true };
  await update(readyRef, playerData);
  console.log("準備完了:", playerData);
};

/**
 * プレイヤーの準備状況を監視
 * @param roomId ルームID
 * @param callback プレイヤーデータのリストを返すコールバック
 * @returns リスナー解除関数
 */
export const onPlayerPrepared = (
  ids: BattleRoomIds,
  callback: (players: PlayerData[]) => void
) => {
  const playersRef = ref(db, DATABASE_PATHS.battlePlayers(ids));
  const listener = onValue(playersRef, (snapshot) => {
    const newPlayers = snapshot.val();
    console.log("プレイヤーデータが更新:", newPlayers);
    callback(newPlayers);

    if (
      Object.values(newPlayers).every(
        (player) => (player as PlayerData).isReady
      )
    ) {
      console.log("全プレイヤー準備完了: リスナー解除");
      off(playersRef, "value", listener);
    }
  });

  return () => {
    console.log("onPlayerPreparedのリスナー解除");
    off(playersRef, "value", listener);
  };
};

/**
 * トピックを保存
 * @param roomId ルームID
 * @param topic 生成されたトピック
 */
export const updateTopic = async (ids: BattleRoomIds, topic: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const configRef = ref(db, DATABASE_PATHS.topic(ids));
  const data = { topic: topic };
  await update(configRef, data);
  console.log("トピック生成:", data);
};

/**
 * プレイヤーの準備状況を監視
 * @param roomId ルームID
 * @param callback トピックを返すコールバック
 * @returns リスナー解除関数
 */
export const onGeneratedTopic = (
  ids: BattleRoomIds,
  callback: (topic: string) => void
) => {
  const configRef = ref(db, DATABASE_PATHS.topic(ids));
  const listener = onValue(configRef, (snapshot) => {
    const newTopic = snapshot.val();
    console.log("トピックが更新:", newTopic);
    callback(newTopic);
    console.log("onGeneratedTopicのリスナー解除");

    off(configRef, "value", listener);
  });

  return () => {
    console.log("onGeneratedTopicのリスナー解除 return");
    off(configRef, "value", listener);
  };
};
//#endregion

//#region BattleView

/**
 * メッセージを送信
 * @param roomId ルームID
 * @param message メッセージ内容
 */
export const sendMessage = async (ids: BattleRoomIds, message: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const messageRef = ref(db, DATABASE_PATHS.messages(ids));
  const messageData: Message = {
    senderId: user.uid,
    message,
    timestamp: Date.now(),
  };

  await push(messageRef, messageData);
  console.log("メッセージ送信:", messageData);
};

/**
 * 新しいメッセージを監視
 * @param roomId ルームID
 * @param callback メッセージデータを返すコールバック
 */
export const onMessageAdded = (
  ids: BattleRoomIds,
  callback: (data: any) => void
) => {
  const messagesRef = ref(db, DATABASE_PATHS.messages(ids));

  onChildAdded(messagesRef, (snapshot) => {
    const newMessage = snapshot.val();
    console.log("新しいメッセージが追加:", newMessage);
    callback(newMessage);
  });
};

/**
 * 回答を送信
 * @param roomId ルームID
 * @param answer 提出された回答
 */
export const sendAnswer = async (ids: BattleRoomIds, answer: SubmitAnswer) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const answerRef = ref(db, DATABASE_PATHS.submittedAnswers(ids));
  await push(answerRef, answer);
  console.log("回答送信:", answer);
};

/**
 * 両プレイヤーの回答を確認
 * @param roomId ルームID
 */
export const checkAnswers = (ids: BattleRoomIds) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const answerRef = ref(db, DATABASE_PATHS.submittedAnswers(ids));

  get(answerRef)
    .then((answersSnapshot) => {
      const answers = answersSnapshot.val();
      if (answers && Object.keys(answers).length === 2) {
        console.log("両プレイヤーの回答が揃いました:", answers);
        calculateBattleResult(ids);
      } else {
        onValue(answerRef, (snapshot) => {
          const updatedAnswers = snapshot.val();
          if (updatedAnswers && Object.keys(updatedAnswers).length === 2) {
            calculateBattleResult(ids);
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

/**
 * バトル結果を監視
 * @param roomId ルームID
 * @param isHost ホストかどうか
 * @param callback バトル結果データを返すコールバック
 * @returns リスナー解除関数
 */
export const onResultUpdated = (
  ids: BattleRoomIds,
  isHost: boolean,
  callback: (players: ResultData | null) => void
) => {
  const resultRef = ref(db, DATABASE_PATHS.result(ids));

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
      } else {
        console.log("バトル結果なし");
        callback(null);
      }
    },
    (error) => {
      console.error("バトル結果監視エラー:", error);
      callback(null);
    }
  );

  return () => {
    console.log("onResultUpdatedのリスナー解除");
    off(resultRef, "value", listener);
  };
};

//#endregion
