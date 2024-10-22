import { ref, push, get, onValue, remove, child } from "firebase/database";
import { auth } from "./firebase_f.ts"; // Firebaseの認証インスタンスをインポート
import { db } from "./firebase_f.ts"; // Firebase初期化ファイルからデータベースをインポート
import { RoomData } from "shared/dist/types";

//#region HomeView
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
    console.log("roomId", roomId);
    const dbRef = ref(db);
    const roomRef = ref(db, `rooms/${roomId}`);
    console.log("roomRef", roomRef);
    const snapshot = await get(roomRef);
    console.log("snapshot", snapshot);

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

// // マッチング成立時、マッチングがキャンセルされた場合やリロード時にwaitingPlayersから削除する関数
// export const removeFromWaitingList = async () => {
//   const user = auth.currentUser;
//   if (!user) {
//     throw new Error("ログインしていないユーザーです。");
//   }

//   const playerId = user.uid;
//   const playerRef = ref(db, "waitingPlayers/" + playerId);
//   await remove(playerRef); // 待機リストからプレイヤーを削除
//   console.log("プレイヤーを待機リストから削除しました。");
// };

//#region BattleView
// メッセージを送信する関数
export const sendMessage = async (roomId: string, message: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const messageRef = ref(db, `rooms/${roomId}/messages`);
  const messageData = {
    senderId: user.uid,
    message,
    timestamp: Date.now(),
  };

  await push(messageRef, messageData);
  console.log("メッセージを送信しました。");
};

// バトルログの更新を監視するリスナー
export const onTurnUpdated = (
  roomId: string,
  callback: (data: any) => void
) => {
  const battleLogRef = ref(db, `rooms/${roomId}/battleLog`);

  // バトルログの更新をリアルタイムで監視
  onValue(battleLogRef, (snapshot) => {
    const battleLogData = snapshot.val();
    if (battleLogData) {
      callback(battleLogData); // バトルログが更新されたらコールバックを実行
    }
  });
};

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
