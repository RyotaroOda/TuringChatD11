//frontend/src/services/firebase-realtime-database.ts
import {
  ref,
  push,
  get,
  onValue,
  onChildAdded,
  off,
  update,
  set,
} from "firebase/database";
import { db, auth } from "./firebase_f.ts"; // Firebaseの認証インスタンスをインポート
import {
  BattleLog,
  BattleResult,
  Message,
  PlayerData,
  ResultData,
  RoomData,
  SubmitAnswer,
} from "shared/dist/types";
import { DATABASE_PATHS } from "shared/dist/database-paths";
import { calculateBattleResult } from "./firebase-functions-client.ts";

//#region HomeView
// // プレイヤーデータを監視
// export const onRoomPlayersUpdated = (
//   roomId: string,
//   callback: (players: PlayerData[]) => void,
//   stop: { current: boolean }
// ) => {
//   const playersRef = ref(db, DATABASE_PATHS.players(roomId));
//   console.log("リスナーを設定します: ルームID", roomId);
//   const listener = onValue(
//     playersRef,
//     (snapshot) => {
//       if (stop.current) {
//         // `stop` が `true` の場合、リスナーを解除して終了
//         off(playersRef, "value", listener);
//         console.log("リスナーが解除されました");
//         return;
//       }
//       const PlayerData = snapshot.val() as PlayerData[]; // RoomData型にキャスト
//       if (PlayerData) {
//         console.log("プレイヤーデータが更新されました。", PlayerData);
//         callback(PlayerData); // データがある場合はコールバックを呼び出す
//       } else {
//         console.error("ルームが存在しません。");
//       }
//     },
//     (error) => {
//       console.error("ルームデータの監視中にエラーが発生しました:", error);
//     }
//   );

//   return () => {
//     console.log("off onRoomPlayersUpdated");
//     off(playersRef, "value", listener);
//   };
// };

export const onMatched = (
  roomId: string,
  callback: (isMatched: boolean) => void
) => {
  const statusRef = ref(db, DATABASE_PATHS.status(roomId));

  // Declare listener first
  let listener: any;

  listener = onValue(statusRef, async (snapshot) => {
    const status = snapshot.val();
    console.log("status", status);

    if (status === "matched") {
      console.log("off onMatched Listener");
      off(statusRef, "value", listener);
      // await set(statusRef, "playing");
      callback(true);
    } else {
      callback(false);
    }
  });

  return () => {
    console.log("off onMatched Listener");
    off(statusRef, "value", listener);
  };
};

// export const stopOnRoomPlayers = (roomId: string) => {
//     const roomRef = ref(db, DATABASE_PATHS.rooms(roomId));
//   off(roomRef);
//   console.log("addPlayerの監視を停止しました。");
// };

// // ルームのデータを監視
// const onRoomUpdate = (
//   roomId: string,
//   callback: (roomData: RoomData) => void,
//   stop: { current: boolean }
// ) => {
//   const roomRef = ref(db, DATABASE_PATHS.room(roomId));

//   console.log("リスナーを設定します: ルームID", roomId);

//   const listener = onValue(
//     roomRef,
//     (snapshot) => {
//       if (stop.current) {
//         off(roomRef, "value", listener);
//         console.log("リスナーが解除されました111");
//         return;
//       }
//       const roomData = snapshot.val() as RoomData | null; // RoomData型にキャスト
//       if (roomData) {
//         console.log("ルームデータが更新されました。", roomData);
//         callback(roomData); // データがある場合はコールバックを呼び出す
//       } else {
//         console.error("ルームが存在しません。");
//       }
//     },
//     (error) => {
//       console.error("ルームデータの監視中にエラーが発生しました:", error);
//     }
//   );
//   return () => {
//     console.log("リスナーが解除されました222");
//     off(roomRef, "value", listener);
//   };
// };

// ルームデータを取得する関数
export const getRoomData = async (roomId: string): Promise<RoomData> => {
  const roomRef = ref(db, DATABASE_PATHS.room(roomId));
  const snapshot = await get(roomRef);

  if (snapshot.exists()) {
    const roomData = snapshot.val();
    console.log("ルームデータを取得しました:", roomData);
    return roomData as RoomData; // RoomData型にキャストして返す
  } else {
    console.error("ルームが存在しません");
    throw new Error("ルームが存在しません");
  }
};
//#endregion

//#region RoomView
export const preparationComplete = async (roomId: string, playerId: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }
  const readyRef = ref(db, DATABASE_PATHS.ready(roomId, playerId));
  const playerData = {
    isReady: true,
  };
  await update(readyRef, playerData);
  console.log("準備完了！", playerData);
};

export const onPlayerPrepared = (
  roomId: string,
  callback: (players: PlayerData[]) => void
) => {
  // プレイヤーリストの参照
  const playersRef = ref(db, DATABASE_PATHS.players(roomId));

  // リスナーを宣言（未初期化状態で宣言する）
  let listener: any;

  // プレイヤーが追加されたときの監視
  listener = onValue(playersRef, (snapshot) => {
    const newPlayers = snapshot.val();
    console.log("プレイヤーデータが更新されました。", newPlayers);
    callback(newPlayers); // 新しいプレイヤーをコールバックで返す
    if (
      Object.values(newPlayers).every(
        (player) => (player as PlayerData).isReady
      )
    ) {
      off(playersRef, "value", listener);
    }
  });

  return () => {
    console.log("off onRoomPlayersUpdated");
    off(playersRef, "value", listener);
  };
};

//#endregion

//#region BattleView

//#region メッセージ
// メッセージを送信する関数
export const sendMessage = async (roomId: string, message: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const messageRef = ref(db, DATABASE_PATHS.messages(roomId));
  console.log("メッセージ:", message);
  const messageData: Message = {
    senderId: user.uid,
    message,
    timestamp: Date.now(),
  };
  https: await push(messageRef, messageData);
  console.log("メッセージを送信しました。", messageData);
};

export const onMessageAdded = (
  roomId: string,
  callback: (data: any) => void
) => {
  // メッセージリストの参照
  const messagesRef = ref(db, DATABASE_PATHS.messages(roomId));

  // メッセージが追加されたときの監視
  onChildAdded(messagesRef, (snapshot) => {
    const newMessage = snapshot.val();
    console.log("メッセージが追加されました。", newMessage);
    callback(newMessage); // 新しいメッセージをコールバックで返す
  });
};

//#endregion

//#region バトル終了時
// 回答を送信する関数
export const sendAnswer = async (roomId: string, answer: SubmitAnswer) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const answerRef = ref(db, DATABASE_PATHS.submittedAnswers(roomId));
  await push(answerRef, answer);
  console.log("回答を送信しました。", answer);
};

// 両プレイヤーの回答が揃ったらサーバーレス関数でスコア計算する
export const checkAnswers = (roomId: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }
  // メッセージリストの参照
  const answerRef = ref(db, DATABASE_PATHS.submittedAnswers(roomId));
  // 両プレイヤーの選択が揃ったか確認
  get(answerRef)
    .then((answersSnapshot) => {
      if (Object.keys(answersSnapshot.val()).length == 2) {
        console.log("両プレイヤーの回答が揃いました。", answersSnapshot.val());
        calculateBattleResult(roomId); //awaitしない
      } else {
        // 要素数が2未満の場合、リスナーを設定して監視
        onValue(answerRef, (snapshot) => {
          const updatedData = snapshot.val();
          const updatedCount = updatedData
            ? Object.keys(updatedData).length
            : 0;

          // 2つになったタイミングで `func()` を実行し、リスナーを解除
          if (updatedCount >= 2) {
            calculateBattleResult(roomId); //awaitしない
            off(answerRef); // リスナーを解除
            console.log("off checkAnswers");
          }
        });
      }
    })
    .catch((error) => {
      console.error("回答の確認中にエラーが発生しました:", error);
    });
};

//resultが更新されたらバトル終了
export const onResultUpdated = (
  roomId: string,
  isHost: boolean,
  callback: (players: ResultData | null) => void
) => {
  const resultRef = ref(db, DATABASE_PATHS.result(roomId));
  const listener = onValue(
    resultRef,
    (snapshot) => {
      const serverData = snapshot.val() as BattleResult; // RoomData型にキャスト
      if (serverData) {
        console.log("バトル結果が更新されました。", serverData);
        const result: ResultData = {
          playerId: auth.currentUser?.uid || "",
          myAnswer: isHost ? serverData.answers[0] : serverData.answers[1],
          opponentAnswer: isHost
            ? serverData.answers[1]
            : serverData.answers[0],
          corrects: serverData.corrects,
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
        console.log("no result data");
        callback(null);
      }
    },
    (error) => {
      console.error("ルームデータの監視中にエラーが発生しました:", error);
      callback(null);
    }
  );
  return () => {
    console.log("off onResultUpdated");
    off(resultRef, "value", listener);
  };
};

//#endregion
