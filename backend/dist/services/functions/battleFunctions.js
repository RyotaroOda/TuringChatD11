"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBattleResultFunction = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_b_1 = require("../firebase_b"); // Firebase 初期化ファイル
exports.calculateBattleResultFunction = functions.https.onCall(async (request) => {
    // console.log("request", request);
    const playerId = request.auth?.uid;
    if (!playerId) {
        throw new functions.https.HttpsError("unauthenticated", "認証が必要です");
    }
    const roomId = request.data;
    const answerRef = firebase_b_1.db.ref(`rooms/${roomId}/battleLog/submittedAnswers`);
    // const answerRef = db.ref(request.data);
    // `get` メソッドを呼び出して、スナップショットを取得
    const answersSnapshot = await answerRef.get();
    if (!answersSnapshot.exists()) {
        throw new functions.https.HttpsError("not-found", "回答が見つかりませんでした");
    }
    // スナップショットからデータを取得し、コンソールに出力
    const answerData = answersSnapshot.val();
    // 回答者を特定
    const [firstAnswer, secondAnswer] = Object.values(answerData);
    const isFirstAnswerByPlayer = firstAnswer.playerId === playerId;
    console.log("firstAnswer", firstAnswer);
    const answers = isFirstAnswerByPlayer
        ? [firstAnswer, secondAnswer]
        : [secondAnswer, firstAnswer];
    const corrects = {
        player1Correct: answers[0].select === answers[1].identity,
        player2Correct: answers[1].select === answers[0].identity,
    };
    //スコア計算
    //自分が正解したら1点、＋相手が不正解だったら1点
    const scores = {
        player1Score: corrects.player1Correct
            ? 1
            : 0 + (corrects.player2Correct ? 0 : 1),
        player2Score: corrects.player2Correct
            ? 1
            : 0 + (corrects.player1Correct ? 0 : 1),
    };
    const result = {
        corrects: [corrects.player1Correct, corrects.player2Correct],
        scores: [scores.player1Score, scores.player2Score],
        answers: answers,
    };
    console.log("result", result);
    await firebase_b_1.db.ref(`rooms/${roomId}/battleLog/result`).set(result);
    await firebase_b_1.db.ref(`rooms/${roomId}/battleLog/timeStamps/end`).set(Date.now());
    await firebase_b_1.db.ref(`rooms/${roomId}/status`).set("finished");
});
const saveRoomData = async (roomId) => {
    if (!roomId) {
        throw new functions.https.HttpsError("invalid-argument", "roomIdが必要です。");
    }
    try {
        // 1. Firebase Realtime Databaseから`roomId`にあるデータを取得
        const roomRef = firebase_b_1.db.ref(`rooms/${roomId}`);
        const snapshot = await roomRef.once("value");
        const roomData = snapshot.val();
        if (!roomData) {
            throw new functions.https.HttpsError("not-found", "データが見つかりません。");
        }
        // 2. JSONデータとしてバッファに変換
        const jsonData = JSON.stringify(roomData);
        const buffer = Buffer.from(jsonData);
        // 3. Firebase Storageの保存先パスを設定
        const filePath = `backups/${roomId}_backup_${Date.now()}.json`;
        const file = firebase_b_1.storage.bucket().file(filePath);
        // 4. Firebase Storageにファイルとしてアップロード
        await file.save(buffer, {
            metadata: {
                contentType: "application/json",
            },
        });
        console.log(`バックアップが成功しました: ${filePath}`);
        return {
            success: true,
            message: `バックアップが成功しました: ${filePath}`,
        };
    }
    catch (error) {
        console.error("バックアップ中にエラーが発生しました:", error);
        throw new functions.https.HttpsError("internal", "バックアップ中にエラーが発生しました。");
    }
};
const removeRoomData = async (roomId) => {
    if (!roomId) {
        throw new functions.https.HttpsError("invalid-argument", "roomIdが必要です。");
    }
    try {
        // 1. Firebase Realtime Databaseから`roomId`にあるデータを削除
        await firebase_b_1.db.ref(`rooms/${roomId}`).remove();
        console.log(`データの削除が成功しました: ${roomId}`);
        return {
            success: true,
            message: `データの削除が成功しました: ${roomId}`,
        };
    }
    catch (error) {
        console.error("データの削除中にエラーが発生しました:", error);
        throw new functions.https.HttpsError("internal", "データの削除中にエラーが発生しました。");
    }
};
