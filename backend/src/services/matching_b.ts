// services/matching.ts
import { db } from './firebase_b';

interface Player {
  id: string;
  rating: number;
  timeWaiting: number;
}

// マッチングリクエストを処理する関数
export const requestMatch = async (playerId: string, rating: number) => {
  const playerRef = db.ref('waitingPlayers/' + playerId);
  
  const playerData: Player = {
    id: playerId,
    rating: rating,
    timeWaiting: Date.now(),
  };

  await playerRef.set(playerData); // 待機リストにプレイヤーを追加
  console.log("プレイヤーを待機リストに追加しました:", playerId);
};

// マッチング処理を実行する関数
export const findMatch = async (playerId: string, rating: number) => {
  const waitingPlayersRef = db.ref('waitingPlayers');
  const snapshot = await waitingPlayersRef.once('value');
  const waitingPlayers = snapshot.val();

  let bestMatchId: string | null = null;
  let bestMatchDiff = Infinity;

  if (waitingPlayers) {
    Object.keys(waitingPlayers).forEach((key) => {
      const opponent = waitingPlayers[key];
      const ratingDiff = Math.abs(opponent.rating - rating);
      
      if (ratingDiff < bestMatchDiff && opponent.id !== playerId) {
        bestMatchDiff = ratingDiff;
        bestMatchId = opponent.id;
      }
    });

    if (bestMatchId) {
      const roomId = db.ref('rooms').push().key; // 新しいルームIDを生成
      const roomData = {
        player1: playerId,
        player2: bestMatchId,
        createdAt: Date.now(),
      };

      // ルーム情報をデータベースに保存
      await db.ref('rooms/' + roomId).set(roomData);

      // 待機リストから両プレイヤーを削除
      await db.ref('waitingPlayers/' + playerId).remove();
      await db.ref('waitingPlayers/' + bestMatchId).remove();

      return { roomId, opponentId: bestMatchId };
    }
  }

  return { message: '対戦相手が見つかりませんでした' };
};

// 待機リストからプレイヤーを削除する関数
export const removePlayerFromWaitingList = async (playerId: string) => {
  const playerRef = db.ref('waitingPlayers/' + playerId);
  await playerRef.remove();
  console.log("プレイヤーを待機リストから削除しました:", playerId);
};
