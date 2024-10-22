"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelMatchFunction = exports.requestMatchFunction = exports.testFunction = void 0;
//src/services/functions/matching_f_b.ts
// import * as functions from "firebase-functions";
const types_1 = require("shared/dist/types");
const firebase_b_1 = require("../firebase_b");
const https_1 = require("firebase-functions/v2/https");
//バトル設定
const battleConfig = {
    maxTurn: 6 * 2,
    battleType: types_1.BattleType.Single,
    oneTurnTime: 60,
};
const waitingPlayersRef = firebase_b_1.db.ref("randomMatching/waitingPlayers/");
// テスト関数
exports.testFunction = (0, https_1.onCall)((request) => {
    // テスト用にシンプルなレスポンスを返す
    const text = "Test test test";
    const data = 999;
    return {
        message: "Test function executed successfully!",
        text: text,
        data: data,
    };
});
const authCheck = (playerId) => {
    if (!playerId) {
        throw new https_1.HttpsError("unauthenticated", "認証が必要です");
    }
    return playerId;
};
const createRoom = async (player, player2) => {
    const roomId = firebase_b_1.db.ref("rooms").push().key;
    const roomData = {
        roomId: roomId,
        player1: player,
        battleConfig: battleConfig,
        battleLog: types_1.newBattleLog,
    };
    // ルーム情報をデータベースに保存
    await firebase_b_1.db.ref("rooms/" + roomId).set(roomData);
    return roomId;
};
const joinRoom = async (roomId, player) => {
    const roomSnapshot = await firebase_b_1.db.ref(`rooms/${roomId}`).once("value");
    const roomData = roomSnapshot.val();
    if (!roomData) {
        throw new https_1.HttpsError("not-found", "ルームが見つかりません");
    }
    if (roomData.player2) {
        throw new https_1.HttpsError("already-exists", "既にプレイヤー2が存在します");
    }
    await firebase_b_1.db.ref(`rooms/${roomId}/player2`).set(player);
};
// マッチングリクエストを処理するFirebase Function 引数:PlayerData
exports.requestMatchFunction = (0, https_1.onCall)(async (request) => {
    const playerId = authCheck(request.auth?.uid ?? ""); // マッチング処理を実行
    const player = request.data;
    const snapshot = await waitingPlayersRef.once("value"); // Firebase Realtime Databaseから一度だけデータを取得
    const waitingPlayers = snapshot.val(); // 待機中のプレイヤーのデータを取得
    /// マッチング相手が見つかった場合
    if (waitingPlayers) {
        // 待機リストに他のプレイヤーがいる場合、そのプレイヤーのルームに参加
        const opponentKey = Object.keys(waitingPlayers)[0];
        const opponent = waitingPlayers[opponentKey];
        const roomId = opponent.roomId;
        // 待機リストから相手を削除
        await waitingPlayersRef.child(opponentKey).remove();
        await joinRoom(roomId, player);
        return {
            roomId: roomId,
            startBattle: true,
            message: "success to match",
        }; // マッチング成功時にルームIDと相手のIDを返す
    }
    // マッチング相手が見つからなかった場合
    else {
        // 待機プレイヤーがいない場合、新しいルームを作成
        const roomId = await createRoom(player); // 新しいルームIDを生成
        // 待機リストにプレイヤーを追加（ルームIDも含む）
        const waitingData = { id: playerId, roomId, timeWaiting: Date.now() };
        await waitingPlayersRef.child(playerId).set(waitingData);
        return {
            roomId: roomId,
            startBattle: false,
            message: "Waiting for an opponent...",
        };
    }
});
// プレイヤーを待機リストから削除するFirebase Function
exports.cancelMatchFunction = (0, https_1.onCall)(async (request) => {
    const playerId = authCheck(request.auth?.uid ?? "");
    const playerSnapshot = await firebase_b_1.db
        .ref(`${waitingPlayersRef}/${playerId}`)
        .once("value");
    const playerData = playerSnapshot.val();
    if (playerData && playerData.roomId) {
        // 自分が作ったルームも削除
        await firebase_b_1.db.ref(`rooms/${playerData.roomId}`).remove();
    }
    // 待機リストから自分を削除
    await waitingPlayersRef.remove();
    console.log("プレイヤーを待機リストから削除しました:", playerId);
});
// 初期化処理：Realtime Database の初期化
const initializeDatabase = async () => {
    try {
        // 初期化するデータ構造 (例：rooms, waitingPlayers などをクリア)
        const initialData = {
            rooms: null,
            randomMatching: null, // 待機中のプレイヤーデータを削除
        };
        // Firebase Realtime Database に初期データを設定
        await firebase_b_1.db.ref().set(initialData);
        console.log("Realtime Database の初期化が完了しました。");
        console.log("Generating Functions...");
    }
    catch (error) {
        console.error("Realtime Database の初期化中にエラーが発生しました:", error);
    }
};
// サーバー起動時に初期化処理を実行
initializeDatabase();
