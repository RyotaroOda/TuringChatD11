// frontend/src/services/firebase.ts
// FRD = Firebase Realtime Database
import { ref, push, onValue, update, set } from "firebase/database";
import { database } from "./firebase.ts"; 

import { BattleLog } from "../../../shared/types.ts";

// プレイヤー名を保存
export const savePlayerName = async (playerId: string, playerName: string) => {
  const playerRef = ref(database, 'players/' + playerId);
  await set(playerRef, {
    playerName,
    status: "online",
  });
  console.log("Player name saved:", playerName);
};

export const requestMatch = async (playerId: string): Promise<string> => {
  const matchRef = ref(database, 'matches');
  const newMatchRef = await push(matchRef, {
    playerId,
    status: "waiting",
  });

  // マッチングが成功したらルームIDを返す（仮実装）
  const roomId = newMatchRef.key;  // 新しいマッチのキーがルームIDとして使われる
  await update(ref(database, 'rooms/' + roomId), {
    player1: playerId,
  });

  return roomId!;
};

// メッセージを送信
export const sendMessage = async (roomId: string, message: string, playerId: string) => {
  const messageRef = ref(database, `rooms/${roomId}/battleLog/messages`);
  await push(messageRef, {
    senderId: playerId,
    message,
    timestamp: Date.now(),
  });
};

// ターン更新リスナー
export const onTurnUpdated = (roomId: string, callback: (data: { battleLog: BattleLog }) => void) => {
  const turnRef = ref(database, `rooms/${roomId}/battleLog`);
  onValue(turnRef, (snapshot) => {
    const battleLog = snapshot.val();
    callback({ battleLog });
  });
};

// バトル終了を監視
export const onBattleEnd = (roomId: string, callback: () => void) => {
  const endRef = ref(database, `rooms/${roomId}/battleEnd`);
  onValue(endRef, (snapshot) => {
    if (snapshot.exists()) {
      callback();
    }
  });
};
