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
    const playerId = request.auth?.uid;
    if (!playerId) {
        throw new functions.https.HttpsError("unauthenticated", "認証が必要です");
    }
    const roomId = request.data;
    const answerRef = firebase_b_1.db.ref(`${roomId}/battleConfig/submittedAnswers`);
    //回答を取得
    const answersSnapshot = await answerRef.once("value");
    const answers = answersSnapshot.val();
    //
    const player1Answer = answers[0];
    const player2Answer = answers[1];
    const corrects = {
        player1Correct: player1Answer.select === player2Answer.identity,
        player2Correct: player2Answer.select === player1Answer.identity,
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
    await firebase_b_1.db.ref(`rooms/${roomId}/battleLog/result`).set(result);
    await firebase_b_1.db.ref(`rooms/${roomId}/battleLog/status`).set("finished");
    return { message: "Both players have submitted their choices." };
});
