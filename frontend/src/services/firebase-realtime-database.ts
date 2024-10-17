
import { getDatabase, ref, push, set, update, onValue, remove } from "firebase/database";
import { auth } from "./firebase.ts"; // Firebaseの認証インスタンスをインポート
import { getFunctions, httpsCallable } from "firebase/functions"; // Firebase Functions呼び出し
import { db } from "./firebase.ts"; // Firebase初期化ファイルからデータベースをインポート

// マッチングリクエストを行う関数
export const requestMatch = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const playerId = user.uid;
  const playerRating = Math.floor(Math.random() * 1000); // 仮のレーティングを生成（本番ではユーザーの実際のスキルに基づく）

  // プレイヤー情報を待機中のプレイヤーリストに追加
  const playerData = {
    id: playerId,
    rating: playerRating,
    timeWaiting: Date.now(),
  };

  const waitingPlayersRef = ref(db, "waitingPlayers/" + playerId);
  await set(waitingPlayersRef, playerData);

  console.log("プレイヤーを待機リストに追加しました。プレイヤーID:", playerId);
};

// マッチングが成立したらコールバックを実行するリスナー
export const onMatchFound = (callback: (data: any) => void) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const playerId = user.uid;
  const playerRef = ref(db, "players/" + playerId + "/match");
  
  // プレイヤーのマッチング情報を監視
  onValue(playerRef, (snapshot) => {
    const matchData = snapshot.val();
    if (matchData) {
      callback(matchData); // マッチングが見つかればコールバックを実行
    }
  });
};

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
export const onTurnUpdated = (roomId: string, callback: (data: any) => void) => {
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

// マッチング成立時、マッチングがキャンセルされた場合やリロード時にwaitingPlayersから削除する関数
export const removeFromWaitingList = async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("ログインしていないユーザーです。");
    }
  
    const playerId = user.uid;
    const playerRef = ref(db, "waitingPlayers/" + playerId);
    await remove(playerRef); // 待機リストからプレイヤーを削除
    console.log("プレイヤーを待機リストから削除しました。");
  };
