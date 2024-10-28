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
    console.log("roomId", roomId);
    const answerRef = firebase_b_1.db.ref(`rooms/${roomId}/battleLog/submittedAnswers`);
    console.log("request data", request.data);
    // const answerRef = db.ref(request.data);
    // `get` メソッドを呼び出して、スナップショットを取得
    console.log("Attempting to retrieve data at:", request.data);
    const answersSnapshot = await answerRef.get();
    console.log("Snapshot existence:", answersSnapshot.exists());
    if (!answersSnapshot.exists()) {
        throw new functions.https.HttpsError("not-found", "回答が見つかりませんでした");
    }
    // スナップショットからデータを取得し、コンソールに出力
    const answers = answersSnapshot.val();
    console.log("answers", answers);
    // ここでスコア計算のロジックを追加
    //回答を取得
    // const ansSnapshot = await answerRef.get;
    // console.log("getSnapshot", ansSnapshot);
    // const answersSnapshot = await answerRef.once("value");
    // console.log("answersSnapshot", answersSnapshot.val);
    // const answers: SubmitAnswer[] = answersSnapshot.val() as SubmitAnswer[];
    // //
    // const keys = Object.keys(answers);
    // const player1Answer =
    //   answers[keys[0]].playerId === playerId
    //     ? answers[keys[0]]
    //     : answers[keys[1]];
    // const player2Answer =
    //   answers[keys[0]].playerId === playerId
    //     ? answers[keys[1]]
    //     : answers[keys[0]];
    // 回答者を特定
    const [firstAnswer, secondAnswer] = Object.values(answers);
    const isFirstAnswerByPlayer = firstAnswer.playerId === playerId;
    console.log("firstAnswer", firstAnswer);
    const player1Answer = isFirstAnswerByPlayer ? firstAnswer : secondAnswer;
    const player2Answer = isFirstAnswerByPlayer ? secondAnswer : firstAnswer;
    console.log("player1Answer", player1Answer);
    const corrects = {
        player1Correct: player1Answer.select === player2Answer.identity,
        player2Correct: player2Answer.select === player1Answer.identity,
    };
    console.log("corrects", corrects);
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
    console.log("scores", scores);
    const result = {
        corrects: [corrects.player1Correct, corrects.player2Correct],
        scores: [scores.player1Score, scores.player2Score],
        answers: answers,
    };
    console.log("result", result);
    await firebase_b_1.db.ref(`rooms/${roomId}/battleLog/result`).set(result);
    await firebase_b_1.db.ref(`rooms/${roomId}/status`).set("finished");
    return { message: "Both players have submitted their choices." };
});
