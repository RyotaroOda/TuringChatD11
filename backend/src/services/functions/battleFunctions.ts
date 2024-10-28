import * as functions from "firebase-functions";
import { db } from "../firebase_b"; // Firebase 初期化ファイル
import { BattleResult, SubmitAnswer } from "shared/dist/types";

export const calculateBattleResultFunction = functions.https.onCall(
  async (request) => {
    // console.log("request", request);
    const playerId = request.auth?.uid;
    if (!playerId) {
      throw new functions.https.HttpsError("unauthenticated", "認証が必要です");
    }
    const roomId = request.data;
    const answerRef = db.ref(`rooms/${roomId}/battleLog/submittedAnswers`);
    // const answerRef = db.ref(request.data);

    // `get` メソッドを呼び出して、スナップショットを取得
    const answersSnapshot = await answerRef.get();
    if (!answersSnapshot.exists()) {
      throw new functions.https.HttpsError(
        "not-found",
        "回答が見つかりませんでした"
      );
    }

    // スナップショットからデータを取得し、コンソールに出力
    const answerData: SubmitAnswer[] = answersSnapshot.val() as SubmitAnswer[];

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
    const result: BattleResult = {
      corrects: [corrects.player1Correct, corrects.player2Correct],
      scores: [scores.player1Score, scores.player2Score],
      answers: answers,
    };
    console.log("result", result);
    await db.ref(`rooms/${roomId}/battleLog/result`).set(result);
    await db.ref(`rooms/${roomId}/status`).set("finished");

    return { message: "Both players have submitted their choices." };
  }
);
