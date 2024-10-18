// import { Player } from '../../../shared/types.ts';
// import { v4 as uuidv4 } from "uuid"; // uuidをインポート

// let waitingPlayers: string[] = []; // 待機中のプレイヤーIDのリスト
// let waitingPlayersWithRating: Player[] = []; // レート待機中のプレイヤーリスト

// // ランダムマッチングリクエスト
// export function requestRandomMatch(playerId: string) {
//   if (waitingPlayers.length === 0) {
//     waitingPlayers.push(playerId); // 待機リストにプレイヤーを追加
//     console.log(`${playerId} is waiting for a match...`);
//   } else {
//     const opponentId = waitingPlayers.pop(); // 待機中のプレイヤーを取得
//     if (opponentId) {
//       const roomId = generateRoomId(); // 部屋IDを生成
//       startMatch(playerId, opponentId, roomId); // 対戦開始
//     }
//   }
// }

// // タイムアウト付きレートマッチングリクエスト
// export function requestRateMatch(player: Player) {
//     const maxWaitingTime = 300; // 最大待機時間（秒）
//     let matchFound = false;
  
//     const interval = setInterval(() => {
//       player.timeWaiting += 10; // 待機時間を10秒ずつ増加
  
//       waitingPlayersWithRating.forEach(opponent => {
//         const ratingDiff = Math.abs(opponent.rating - player.rating);
//         const allowedRatingDiff = Math.min(player.timeWaiting, maxWaitingTime); // 待機時間に基づいて許容範囲を拡大
  
//         if (ratingDiff <= allowedRatingDiff) {
//           const roomId = generateRoomId();
//           startMatch(player.id, opponent.id, roomId); // マッチング
//           waitingPlayersWithRating = waitingPlayersWithRating.filter(p => p.id !== opponent.id); // 待機リストから削除
//           matchFound = true;
//           clearInterval(interval); // マッチが成立したらタイマーを停止
//         }
//       });
  
//       if (matchFound) return;
  
//       if (player.timeWaiting >= maxWaitingTime) {
//         console.log(`${player.id} could not find a suitable match.`);
//         waitingPlayersWithRating.push(player);
//         clearInterval(interval); // タイムアウト処理
//       }
//     }, 10000); // 10秒ごとに許容範囲を拡大
//   }

// function startMatch(player1: string, player2: string, roomId: string) {
//   console.log(`Matched ${player1} with ${player2} in room ${roomId}`);
//   // 対戦相手に部屋の情報を送信する処理（省略可能）
// }

// function generateRoomId() {
//   return uuidv4(); // UUIDを使用してユニークな部屋IDを生成
// }
