import {
  ref,
  push,
  get,
  onValue,
  remove,
  child,
  onChildAdded,
  off,
} from "firebase/database";
import { auth } from "./firebase_f.ts"; // Firebaseの認証インスタンスをインポート
import { db } from "./firebase_f.ts"; // Firebase初期化ファイルからデータベースをインポート
import {
  BattleLog,
  BattleResult,
  Message,
  PlayerData,
  ResultData,
  RoomData,
  SubmitAnswer,
} from "shared/dist/types";
//#region HomeView
// プレイヤーデータを監視
export const onRoomPlayersUpdated = (
  roomId: string,
  callback: (players: PlayerData[] | null) => void,
  stop: { current: boolean }
) => {
  const roomRef = ref(db, `rooms/${roomId}/players`);
  const listener = onValue(
    roomRef,
    (snapshot) => {
      if (stop.current) {
        // `stop` が `true` の場合、リスナーを解除して終了
        off(roomRef, "value", listener);
        console.log("リスナーが解除されました");
        return;
      }
      const PlayerData = snapshot.val() as PlayerData[] | null; // RoomData型にキャスト
      if (PlayerData) {
        console.log("プレイヤーデータが更新されました。", PlayerData);
        callback(PlayerData); // データがある場合はコールバックを呼び出す
      } else {
        console.error("ルームが存在しません。");
        callback(null);
      }
    },
    (error) => {
      console.error("ルームデータの監視中にエラーが発生しました:", error);
      callback(null);
    }
  );

  return () => {
    console.log("off onRoomPlayersUpdated");
    off(roomRef, "value", listener);
  };
};

// export const stopOnRoomPlayers = (roomId: string) => {
//   const roomRef = ref(db, `rooms/${roomId}/players`);
//   off(roomRef);
//   console.log("addPlayerの監視を停止しました。");
// };

// ルームのデータを監視
export const onRoomUpdate = (
  roomId: string,
  callback: (roomData: RoomData | null) => void,
  stop: { current: boolean }
) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  const listener = onValue(
    roomRef,
    (snapshot) => {
      if (stop.current) {
        off(roomRef, "value", listener);
        console.log("リスナーが解除されました111");
        return;
      }
      const roomData = snapshot.val() as RoomData | null; // RoomData型にキャスト
      if (roomData) {
        console.log("ルームデータが更新されました。", roomData);
        callback(roomData); // データがある場合はコールバックを呼び出す
      } else {
        console.error("ルームが存在しません。");
        callback(null);
      }
    },
    (error) => {
      console.error("ルームデータの監視中にエラーが発生しました:", error);
      callback(null);
    }
  );
  return () => {
    console.log("リスナーが解除されました222");
    off(roomRef, "value", listener);
  };
};

// ルームデータを取得する関数 未使用
export const getRoomData = async (roomId: string): Promise<RoomData | null> => {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      const roomData = snapshot.val();
      console.log("ルームデータを取得しました:", roomData);
      return roomData as RoomData; // RoomData型にキャストして返す
    } else {
      console.error("ルームが存在しません");
      return null;
    }
  } catch (error) {
    console.error("ルームデータの取得に失敗しました:", error);
    return null;
  }
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

  const messageRef = ref(db, `rooms/${roomId}/battleLog/messages`);
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
  const messagesRef = ref(db, `rooms/${roomId}/battleLog/messages`);

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

  const answerRef = ref(
    db,
    `rooms/${roomId}/battleLog/submittedAnswers/${user.uid}`
  );
  await push(answerRef, answer);
  console.log("回答を送信しました。", answer);
};

// 両プレイヤーの回答が揃ったらサーバーレス関数wを呼び出す
export const checkAnswers = (roomId: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }
  // メッセージリストの参照
  const answerRef = ref(db, `rooms/${roomId}/battleLog/submittedAnswers`);
  // 両プレイヤーの選択が揃ったか確認
  get(answerRef)
    .then((answersSnapshot) => {
      if (Object.keys(answersSnapshot.val()).length == 2) {
        console.log("両プレイヤーの回答が揃いました。");
        //TODO: firebase functionを呼び出す
        // func();
      } else {
        // 要素数が2未満の場合、リスナーを設定して監視
        onValue(answerRef, (snapshot) => {
          const updatedData = snapshot.val();
          const updatedCount = updatedData
            ? Object.keys(updatedData).length
            : 0;

          // 2つになったタイミングで `func()` を実行し、リスナーを解除
          if (updatedCount >= 2) {
            // func();
            off(answerRef); // リスナーを解除
          }
        });
      }
    })
    .catch((error) => {
      console.error("回答の確認中にエラーが発生しました:", error);
    });
};

//resultが返ってきたらバトル終了
export const onResultUpdated = (
  roomId: string,
  callback: (players: ResultData[] | null) => void
) => {
  const resultRef = ref(db, `rooms/${roomId}/battleLog/result`);
  const listener = onChildAdded(
    resultRef,
    (snapshot) => {
      const serverData = snapshot.val() as BattleResult; // RoomData型にキャスト
      if (serverData) {
        // データがある場合
        //TODO: データを整形して返す
      } else {
        console.error("ルームが存在しません。");
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

// バトル終了を監視するリスナー
// export const onBattleEnd = (roomId: string, callback: () => void) => {
//   const statusRef = ref(db, `rooms/${roomId}/status`);

//   // バトルの終了を監視
//   onValue(statusRef, (snapshot) => {
//     const status = snapshot.val();
//     if (status === "ended") {
//       callback(); // バトルが終了したらコールバックを実行
//     }
//   });
// };
//#endregion
