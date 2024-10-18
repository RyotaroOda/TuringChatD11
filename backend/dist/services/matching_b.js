"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePlayerFromWaitingList = exports.findMatch = exports.requestMatch = void 0;
// services/matching.ts
const firebase_b_1 = require("./firebase_b");
// マッチングリクエストを処理する関数
const requestMatch = async (playerId, rating) => {
    const playerRef = firebase_b_1.db.ref('waitingPlayers/' + playerId);
    const playerData = {
        id: playerId,
        rating: rating,
        timeWaiting: Date.now(),
    };
    await playerRef.set(playerData); // 待機リストにプレイヤーを追加
    console.log("プレイヤーを待機リストに追加しました:", playerId);
};
exports.requestMatch = requestMatch;
// マッチング処理を実行する関数
const findMatch = async (playerId, rating) => {
    const waitingPlayersRef = firebase_b_1.db.ref('waitingPlayers');
    const snapshot = await waitingPlayersRef.once('value');
    const waitingPlayers = snapshot.val();
    let bestMatchId = null;
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
            const roomId = firebase_b_1.db.ref('rooms').push().key; // 新しいルームIDを生成
            const roomData = {
                player1: playerId,
                player2: bestMatchId,
                createdAt: Date.now(),
            };
            // ルーム情報をデータベースに保存
            await firebase_b_1.db.ref('rooms/' + roomId).set(roomData);
            // 待機リストから両プレイヤーを削除
            await firebase_b_1.db.ref('waitingPlayers/' + playerId).remove();
            await firebase_b_1.db.ref('waitingPlayers/' + bestMatchId).remove();
            return { roomId, opponentId: bestMatchId };
        }
    }
    return { message: '対戦相手が見つかりませんでした' };
};
exports.findMatch = findMatch;
// 待機リストからプレイヤーを削除する関数
const removePlayerFromWaitingList = async (playerId) => {
    const playerRef = firebase_b_1.db.ref('waitingPlayers/' + playerId);
    await playerRef.remove();
    console.log("プレイヤーを待機リストから削除しました:", playerId);
};
exports.removePlayerFromWaitingList = removePlayerFromWaitingList;
