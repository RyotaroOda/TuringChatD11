import * as functions from "firebase-functions";
import { db, storage } from "../firebase_b"; // Firebase 初期化ファイル
import { BattleResult, SubmitAnswer } from "shared/dist/types";

export const calculateBattleResultFunction = functions.https.onCall(
  async (request) => {
    const playerId = request.auth?.uid;
    if (!playerId) {
      throw new functions.https.HttpsError("unauthenticated", "認証が必要です");
    }
    const roomId = request.data;
    const answerRef = db.ref(`rooms/${roomId}/battleLog/submittedAnswers`);

    // `get` メソッドを呼び出して、スナップショットを取得
    const answersSnapshot = await answerRef.get();
    if (!answersSnapshot.exists()) {
      throw new functions.https.HttpsError(
        "not-found",
        "回答が見つかりませんでした. データベースの初期化をオフにしてください。"
      );
    }

    // スナップショットからデータを取得し、コンソールに出力
    const answerData: SubmitAnswer[] = answersSnapshot.val() as SubmitAnswer[];

    // 回答者を特定
    const [firstAnswer, secondAnswer] = Object.values(answerData);
    const isFirstAnswerByPlayer = firstAnswer.playerId === playerId;
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
    const end = Date.now();
    const start = await db
      .ref(`rooms/${roomId}/battleLog/timeStamps/start`)
      .get();
    const time = end - start.val();

    const result: BattleResult = {
      corrects: [corrects.player1Correct, corrects.player2Correct],
      scores: [scores.player1Score, scores.player2Score],
      answers: answers,
      time: time,
    };
    await db.ref(`rooms/${roomId}/battleLog/result`).set(result);
    await db.ref(`rooms/${roomId}/battleLog/timeStamps/end`).set(end);
    await db.ref(`rooms/${roomId}/status`).set("finished");

    await saveRoomData(roomId);
    await removeRoomData(roomId);
  }
);

const saveRoomData = async (roomId: string) => {
  if (!roomId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "roomIdが必要です。"
    );
  }

  try {
    // 1. Firebase Realtime Databaseから`roomId`にあるデータを取得
    const roomRef = db.ref(`rooms/${roomId}`);
    const snapshot = await roomRef.once("value");
    const roomData = snapshot.val();

    if (!roomData) {
      throw new functions.https.HttpsError(
        "not-found",
        "データが見つかりません。"
      );
    }

    // 2. JSONデータとしてバッファに変換
    const jsonData = JSON.stringify(roomData);
    const buffer = Buffer.from(jsonData);

    // 3. Firebase Storageの保存先パスを設定
    const filePath = `backups/room_data/${roomId}_backup_${Date.now()}.json`;
    const file = storage.bucket().file(filePath);

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
  } catch (error) {
    console.error("バックアップ中にエラーが発生しました:", error);
    throw new functions.https.HttpsError(
      "internal",
      "バックアップ中にエラーが発生しました。"
    );
  }
};

const removeRoomData = async (roomId: string) => {
  if (!roomId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "roomIdが必要です。"
    );
  }

  try {
    // 1. Firebase Realtime Databaseから`roomId`にあるデータを削除
    await db.ref(`rooms/${roomId}`).remove();

    console.log(`データの削除が成功しました: ${roomId}`);
    return {
      success: true,
      message: `データの削除が成功しました: ${roomId}`,
    };
  } catch (error) {
    console.error("データの削除中にエラーが発生しました:", error);
    throw new functions.https.HttpsError(
      "internal",
      "データの削除中にエラーが発生しました。"
    );
  }
};
