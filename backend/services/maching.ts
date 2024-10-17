// import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";

// admin.initializeApp();
// const db = admin.database();

// // リクエストデータの型定義
// interface MatchRequestData {
//   rating: number;
// }

// // サーバーレス関数の定義
// export const requestMatch = functions.https.onCall(async (request: functions.https.CallableRequest<MatchRequestData>) => {
//   const playerId = request.auth?.uid;
//   const playerRating = request.data.rating;

//   if (!playerId) {
//     throw new functions.https.HttpsError(
//       "unauthenticated",
//       "The function must be called while authenticated."
//     );
//   }

//   const playerData = { id: playerId, rating: playerRating, timeWaiting: Date.now() };

//   // 待機中のプレイヤーを取得
//   const waitingPlayersRef = db.ref("waitingPlayers");
//   const snapshot = await waitingPlayersRef.once("value");
//   const waitingPlayers = snapshot.val() || {};

//   // マッチング相手を探す
//   let bestMatchId: string | null = null;
//   let bestMatchDiff = Infinity;

//   Object.keys(waitingPlayers).forEach((key) => {
//     const opponent = waitingPlayers[key];
//     const ratingDiff = Math.abs(opponent.rating - playerRating);

//     if (ratingDiff < bestMatchDiff) {
//       bestMatchDiff = ratingDiff;
//       bestMatchId = key;
//     }
//   });

//   if (bestMatchId) {
//     // マッチング相手が見つかった場合
//     const opponentData = waitingPlayers[bestMatchId];

//     // 両方のプレイヤーを対戦ルームに移動
//     const roomId = db.ref("rooms").push().key;
//     const roomData = {
//       player1: playerId,
//       player2: bestMatchId,
//       createdAt: Date.now(),
//     };

//     await db.ref(`rooms/${roomId}`).set(roomData);
//     await waitingPlayersRef.child(bestMatchId).remove();

//     return { roomId, opponentId: bestMatchId, opponentRating: opponentData.rating };
//   } else {
//     // 待機リストにプレイヤーを追加
//     await waitingPlayersRef.child(playerId).set(playerData);
//     return { message: "Waiting for an opponent..." };
//   }
// });
