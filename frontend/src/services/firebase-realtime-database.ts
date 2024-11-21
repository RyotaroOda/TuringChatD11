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
  BattleLog,
  BattleResult,
  Message,
  PlayerData,
  ResultData,
  RoomData,
  SubmitAnswer,
} from "../shared/types.ts";
import { DATABASE_PATHS } from "../shared/database-paths.ts";
import { calculateBattleResult } from "./firebase-functions-client.ts";

//#region HomeView

/**
 * ルームのマッチング状況を監視
 * @param roomId ルームID
 * @param callback マッチング状況を返すコールバック
 * @returns リスナー解除関数
 */
export const onMatched = (
  roomId: string,
  callback: (isMatched: boolean) => void
) => {
  const statusRef = ref(db, DATABASE_PATHS.status(roomId));
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

/**
 * ルームデータを取得
 * @param roomId ルームID
 * @returns ルームデータ
 * @throws ルームが存在しない場合にエラー
 */
export const getRoomData = async (roomId: string): Promise<RoomData> => {
  const roomRef = ref(db, DATABASE_PATHS.room(roomId));
  const snapshot = await get(roomRef);

  if (snapshot.exists()) {
    const roomData = snapshot.val();
    console.log("ルームデータを取得:", roomData);
    return roomData as RoomData;
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
export const preparationComplete = async (roomId: string, playerId: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const readyRef = ref(db, DATABASE_PATHS.ready(roomId, playerId));
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
  roomId: string,
  callback: (players: PlayerData[]) => void
) => {
  const playersRef = ref(db, DATABASE_PATHS.players(roomId));
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

//#endregion

//#region BattleView

/**
 * メッセージを送信
 * @param roomId ルームID
 * @param message メッセージ内容
 */
export const sendMessage = async (roomId: string, message: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const messageRef = ref(db, DATABASE_PATHS.messages(roomId));
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
  roomId: string,
  callback: (data: any) => void
) => {
  const messagesRef = ref(db, DATABASE_PATHS.messages(roomId));

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
export const sendAnswer = async (roomId: string, answer: SubmitAnswer) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const answerRef = ref(db, DATABASE_PATHS.submittedAnswers(roomId));
  await push(answerRef, answer);
  console.log("回答送信:", answer);
};

/**
 * 両プレイヤーの回答を確認
 * @param roomId ルームID
 */
export const checkAnswers = (roomId: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const answerRef = ref(db, DATABASE_PATHS.submittedAnswers(roomId));

  get(answerRef)
    .then((answersSnapshot) => {
      const answers = answersSnapshot.val();
      if (answers && Object.keys(answers).length === 2) {
        console.log("両プレイヤーの回答が揃いました:", answers);
        calculateBattleResult(roomId);
      } else {
        onValue(answerRef, (snapshot) => {
          const updatedAnswers = snapshot.val();
          if (updatedAnswers && Object.keys(updatedAnswers).length === 2) {
            calculateBattleResult(roomId);
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
  roomId: string,
  isHost: boolean,
  callback: (players: ResultData | null) => void
) => {
  const resultRef = ref(db, DATABASE_PATHS.result(roomId));

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
