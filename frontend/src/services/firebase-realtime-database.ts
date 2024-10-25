import {
  ref,
  push,
  get,
  onValue,
  remove,
  child,
  onChildAdded,
} from "firebase/database";
import { auth } from "./firebase_f.ts"; // Firebaseの認証インスタンスをインポート
import { db } from "./firebase_f.ts"; // Firebase初期化ファイルからデータベースをインポート
import { BattleLog, Message, PlayerData, RoomData } from "shared/dist/types";

//#region HomeView
// ルームのデータを監視
export const onRoomPlayersAdded = (
  roomId: string,
  callback: (players: PlayerData[] | null) => void
) => {
  const roomRef = ref(db, `rooms/${roomId}/players`);
  onChildAdded(
    roomRef,
    (snapshot) => {
      const PlayerData = snapshot.val() as PlayerData[] | null; // RoomData型にキャスト
      if (PlayerData) {
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
};

// ルームのデータを監視
export const onRoomUpdate = (
  roomId: string,
  callback: (roomData: RoomData | null) => void
) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  onValue(
    roomRef,
    (snapshot) => {
      const roomData = snapshot.val() as RoomData | null; // RoomData型にキャスト
      if (roomData) {
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
};

// ルームデータを取得する関数
export const getRoomData = async (roomId: string): Promise<RoomData | null> => {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      const roomData = snapshot.val();
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
  console.log("メッセージを送信しました。");
};

export const onMessageAdded = (
  roomId: string,
  callback: (data: any) => void
) => {
  // メッセージリストの参照
  const messagesRef = ref(db, `rooms/${roomId}/battleLog/messages`);

  // メッセージが追加されたときの監視
  onChildAdded(messagesRef, (snapshot) => {
    console.log("メッセージが追加されました。");
    const newMessage = snapshot.val();
    callback(newMessage); // 新しいメッセージをコールバックで返す
  });
};

// // バトルログの更新を監視するリスナー
// export const onTurnUpdated = (
//   roomId: string,
//   callback: (battleLog: BattleLog) => void
// ) => {
//   const battleLogRef = ref(db, `rooms/${roomId}/battleLog/messages`);
//   console.log("バトルログを監視します。");
//   onValue(
//     battleLogRef,
//     (snapshot) => {
//       const battleLogData = snapshot.val();
//       if (battleLogData) {
//         console.log("バトルログが更新されました。");
//         callback(battleLogData); // バトルログが更新されたらコールバックを実行
//       } else {
//         console.error("バトルログが存在しません。");
//       }
//     },
//     (error) => {
//       console.error("バトルログの監視中にエラーが発生しました:", error);
//     }
//   );
// };

// バトル終了を監視するリスナー
export const onBattleEnd = (roomId: string, callback: () => void) => {
  const statusRef = ref(db, `rooms/${roomId}/status`);

  // バトルの終了を監視
  onValue(statusRef, (snapshot) => {
    const status = snapshot.val();
    if (status === "ended") {
      callback(); // バトルが終了したらコールバックを実行
    }
  });
};
//#endregion
