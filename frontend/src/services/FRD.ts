// FRD = Firebase Realtime Database
import { getDatabase, ref, push, update, onValue } from "firebase/database";
import { db } from "./firebase.ts"; // Firebase初期化ファイルからデータベースをインポート
import { auth } from "./firebase.ts"; // Firebaseの認証情報をインポート

// プレイヤーネームの保存
export const savePlayerName = async (playerName: string) => {
  const user = auth.currentUser; // 現在のユーザーを取得
  if (user) {
    const userId = user.uid;
    await update(ref(db, 'users/' + userId), { name: playerName });
    return userId;
  } else {
    throw new Error("ユーザーがログインしていません");
  }
};

// マッチングリクエスト
export const requestMatch = async () => {
  const user = auth.currentUser; // 現在のユーザーを取得
  if (user) {
    const userId = user.uid;
    const matchRef = push(ref(db, 'matches'));
    await update(matchRef, { player1: userId, status: 'waiting' });
    return matchRef.key;
  } else {
    throw new Error("ユーザーがログインしていません");
  }
};

// マッチング成功時のリスナー
export const onMatchFound = (callback: (data: any) => void) => {
  const matchRef = ref(db, 'matches');
  onValue(matchRef, (snapshot) => {
    const matches = snapshot.val();
    if (matches) {
      Object.keys(matches).forEach((key) => {
        const match = matches[key];
        if (match.status === 'waiting') {
          // マッチング成立の処理を行う
          callback({
            roomId: key,
            opponentId: match.player1,
            battleConfig: match.battleConfig, // 必要なデータを追加
          });
        }
      });
    }
  });
};

// メッセージの送信
export const sendMessage = async (roomId: string, message: string) => {
  const user = auth.currentUser; // 現在のユーザーを取得
  if (user) {
    const messageRef = ref(db, 'rooms/' + roomId + '/messages');
    await push(messageRef, { senderId: user.uid, message });
  } else {
    throw new Error("ユーザーがログインしていません");
  }
};

// ターン更新リスナー
export const onTurnUpdated = (roomId: string, callback: (data: any) => void) => {
  const logRef = ref(db, 'rooms/' + roomId + '/battleLog');
  onValue(logRef, (snapshot) => {
    const battleLog = snapshot.val();
    if (battleLog) {
      callback(battleLog);
    }
  });
};

// バトル終了リスナー
export const onBattleEnd = (roomId: string, callback: () => void) => {
  const roomRef = ref(db, 'rooms/' + roomId + '/status');
  onValue(roomRef, (snapshot) => {
    const status = snapshot.val();
    if (status === 'ended') {
      callback();
    }
  });
};
