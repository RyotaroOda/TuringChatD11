import * as functions from "firebase-functions";
import { db } from "../firebase_b"; // Firebase 初期化ファイル
import { BattleResult, SubmitAnswer } from "shared/dist/types";

export const calculateBattleResultFunction = functions.https.onCall(
  async (request) => {
    const playerId = request.auth?.uid;
    if (!playerId) {
      throw new functions.https.HttpsError("unauthenticated", "認証が必要です");
    }
    const roomId = request.data;
    const answerRef = db.ref(`${roomId}/battleConfig/submittedAnswers`);

    //回答を取得
    const answersSnapshot = await answerRef.once("value");
    const answers: SubmitAnswer[] = answersSnapshot.val() as SubmitAnswer[];
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

    const player1Answer = isFirstAnswerByPlayer ? firstAnswer : secondAnswer;
    const player2Answer = isFirstAnswerByPlayer ? secondAnswer : firstAnswer;

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

    const result: BattleResult = {
      corrects: [corrects.player1Correct, corrects.player2Correct],
      scores: [scores.player1Score, scores.player2Score],
      answers: answers,
    };

    await db.ref(`rooms/${roomId}/battleLog/result`).set(result);
    await db.ref(`rooms/${roomId}/battleLog/status`).set("finished");

    return { message: "Both players have submitted their choices." };
  }
);
