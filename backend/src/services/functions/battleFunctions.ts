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
    console.log("roomId", roomId);
    const answerRef = db.ref(`rooms/${roomId}/battleLog/submittedAnswers`);
    console.log("request data", request.data);
    // const answerRef = db.ref(request.data);

    // `get` メソッドを呼び出して、スナップショットを取得
    console.log("Attempting to retrieve data at:", request.data);
    const answersSnapshot = await answerRef.get();
    console.log("Snapshot existence:", answersSnapshot.exists());
    if (!answersSnapshot.exists()) {
      throw new functions.https.HttpsError(
        "not-found",
        "回答が見つかりませんでした"
      );
    }

    // スナップショットからデータを取得し、コンソールに出力
    const answers: SubmitAnswer[] = answersSnapshot.val() as SubmitAnswer[];
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
