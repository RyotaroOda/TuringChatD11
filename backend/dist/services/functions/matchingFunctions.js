"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelMatchFunction = exports.requestMatchFunction = exports.getNextRoomIdFromWaitingList = exports.removeFromWaitingList = exports.addToWaitingList = exports.testFunction = void 0;
const firebase_b_1 = require("../firebase_b");
const https_1 = require("firebase-functions/v2/https");
//バトル設定
const battleConfig = {
    maxTurn: 1 * 2,
    battleType: "Single",
    oneTurnTime: 60,
};
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
//#region waitingPlayers
const waitingPlayersRef = firebase_b_1.db.ref("randomMatching/waitingPlayers/");
// プレイヤーを待機リストに追加する関数
const addToWaitingList = async (playerId, roomId) => {
    const waitingData = { id: playerId, roomId, timeWaiting: Date.now() };
    await waitingPlayersRef.child(playerId).set(waitingData);
    console.log(`プレイヤー ${playerId} が待機リストに追加されました。`);
};
exports.addToWaitingList = addToWaitingList;
// 待機リストからプレイヤーを削除する関数
const removeFromWaitingList = async (playerId) => {
    await waitingPlayersRef.child(playerId).remove();
    console.log(`プレイヤー ${playerId} が待機リストから削除されました。`);
};
exports.removeFromWaitingList = removeFromWaitingList;
// トランザクションを使用して待機リストから次のプレイヤーを取得し、roomIdを返す関数
const getNextRoomIdFromWaitingList = async () => {
    let roomId = null;
    try {
        const result = await waitingPlayersRef.transaction((waitingPlayers) => {
            if (waitingPlayers) {
                const opponentKey = Object.keys(waitingPlayers)[0]; // 最初のプレイヤーを取得
                const opponent = waitingPlayers[opponentKey];
                roomId = opponent.roomId;
                if (roomId) {
                    // 待機リストからプレイヤーを削除
                    delete waitingPlayers[opponentKey];
                    return waitingPlayers; // 更新された待機リストを返す
                }
            }
            return waitingPlayers; // プレイヤーがいない場合は空文字列を返す
        });
        // トランザクションがコミットされ、プレイヤーが取得できた場合
        if (result.committed) {
            return roomId;
        }
        console.log("null");
        return null; // プレイヤーがいない、または取得できなかった場合
    }
    catch (error) {
        console.error("トランザクションのエラー:", error);
        throw new Error("待機リストからroomIdの取得に失敗しました");
    }
};
exports.getNextRoomIdFromWaitingList = getNextRoomIdFromWaitingList;
//#endregion
//#region rooms
const createRoom = async (player) => {
    const roomId = firebase_b_1.db.ref("rooms").push().key;
    const newBattleLog = {
        phase: "waiting",
        currentTurn: 0,
        messages: [],
        activePlayerId: "player.id",
        submitAnswer: [],
        battleResult: [],
    };
    const roomData = {
        roomId: roomId,
        status: "waiting",
        players: [player],
        battleConfig: battleConfig,
        battleLog: newBattleLog,
    };
    // ルーム情報をデータベースに保存
    await firebase_b_1.db.ref(`rooms/${roomId}`).set(roomData);
    console.log(`新しいルーム ${roomId} が作成されました。`);
    return roomId;
};
// //同時に複数のクライアントが同じデータにアクセスしない場合
// const joinRoom = async (roomId: string, player: PlayerData) => {
//   const roomDataSnapshot = await db.ref(`rooms/${roomId}`).once("value");
//   const roomData = roomDataSnapshot.val();
//   if (roomData && roomData.player2) {
//     throw new HttpsError("already-exists", "既にプレイヤー2が存在します");
//   }
//   // 明示的にセットし、データをデータベースに反映
//   await db.ref(`rooms/${roomId}`).set({
//     ...roomData, // 既存のroomDataを維持
//     player2: player, // player2を追加
//   });
// };
const joinRoom = async (roomId, player) => {
    console.log("joinRoom", roomId, player.name);
    // 現在のメッセージの数を取得して、次のインデックスを決定する
    const snapshot = await firebase_b_1.db.ref(`rooms/${roomId}/players`).get;
    const playerCount = snapshot ? snapshot.length : 0; // メッセージの数を取得
    console.log("playerCount", playerCount);
    try {
        await firebase_b_1.db.ref(`rooms/${roomId}/status`).set("playing");
        await firebase_b_1.db.ref(`rooms/${roomId}/battleLog/phase`).set("chat");
        await firebase_b_1.db.ref(`rooms/${roomId}/players`).push(player); //最後に追加
        return true;
        //TODO: トランザクションを使って安全にデータを更新する
        // // トランザクションを使用してルームに参加する
        // const result = await db.ref(`rooms/${roomId}`).transaction((roomData) => {
        //   if (roomData) {
        //     console.log("roomData", roomData);
        //     if (roomData.player2) {
        //       console.log("既にプレイヤー2が存在します", roomData.player2);
        //       return roomData; // 既にplayer2がいる場合、そのまま返す
        //     }
        //     roomData.player2 = player; // player2を追加
        //     return roomData; // 更新したデータを返す
        //   } else {
        //     console.log("ルームが存在しません");
        //     return; // ルームが存在しない場合は何も返さない
        //   }
        // });
        // // トランザクションが成功し、データがコミットされたか確認
        // if (result.committed) {
        //   console.log("トランザクション成功: ", result.snapshot.val());
        //   return true;
        // }
        // // コミットされなかった場合
        // console.log(
        //   "データの書き込みに失敗しました。result",
        //   result.snapshot.val()
        // );
        // return false;
    }
    catch (error) {
        console.log("競合が発生しました。", error);
        return false;
    }
};
const removeRoom = async (roomId) => {
    await firebase_b_1.db.ref(`rooms/${roomId}`).remove();
};
//#endregion
exports.requestMatchFunction = (0, https_1.onCall)(async (request) => {
    const playerId = authCheck(request.auth?.uid ?? ""); // マッチング処理を実行
    const player = request.data;
    // トランザクションを使って安全に待機リストから次のプレイヤーを取得
    const roomId = await (0, exports.getNextRoomIdFromWaitingList)();
    // マッチング相手が見つかった場合
    if (roomId && (await joinRoom(roomId, player))) {
        // マッチング相手のルームに参加
        console.log(`入室に成功しました。roomId: ${roomId}`);
        return {
            roomId: roomId,
            startBattle: true,
            message: "success to match",
        };
    }
    if (roomId) {
        removeRoom(roomId);
    }
    // マッチング相手がいなかった場合、新しいルームを作成
    const newRoomId = await createRoom(player);
    // 待機リストにプレイヤーを追加
    await (0, exports.addToWaitingList)(playerId, newRoomId);
    return {
        roomId: newRoomId,
        startBattle: false,
        message: "Waiting for an opponent...",
    };
});
// プレイヤーを待機リストから削除するFirebase Function
exports.cancelMatchFunction = (0, https_1.onCall)(async (request) => {
    const playerId = authCheck(request.auth?.uid ?? "");
    (0, exports.removeFromWaitingList)(playerId);
    // 自分が作ったルームも削除
    const playerSnapshot = await firebase_b_1.db
        .ref(`${waitingPlayersRef}/${playerId}`)
        .once("value");
    const playerData = playerSnapshot.val();
    if (playerData && playerData.roomId) {
        await firebase_b_1.db.ref(`rooms/${playerData.roomId}`).remove();
    }
});
