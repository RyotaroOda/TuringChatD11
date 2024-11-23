// backend/src/services/functions/resultFunctions.ts
import * as functions from "firebase-functions";
import { db, storage, firestore } from "../firebase_b";
import { BattleResult, SubmitAnswer } from "../../shared/types";
import { BattleRoomIds, DATABASE_PATHS } from "../../shared/database-paths";

/**
 * バトル結果を計算するクラウド関数
 */
export const calculateResultFunction = functions.https.onCall(
  async (request) => {
    const playerId = request.auth?.uid;
    if (!playerId) {
      throw new functions.https.HttpsError("unauthenticated", "認証が必要です");
    }

    const ids = request.data as BattleRoomIds;
    if (!ids) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "roomIdが必要です。"
      );
    }

    const answerRef = db.ref(DATABASE_PATHS.submittedAnswers(ids));
    const answersSnapshot = await answerRef.get();

    if (!answersSnapshot.exists()) {
      throw new functions.https.HttpsError(
        "not-found",
        "回答が見つかりませんでした。"
      );
    }

    const answerData: SubmitAnswer[] = answersSnapshot.val();
    const [firstAnswer, secondAnswer] = Object.values(answerData);
    const isFirstAnswerByPlayer = firstAnswer.playerId === playerId;

    // 回答と正解の計算
    const answers = isFirstAnswerByPlayer
      ? [firstAnswer, secondAnswer]
      : [secondAnswer, firstAnswer];
    const corrects = {
      player1Correct: answers[0].select === answers[1].isHuman,
      player2Correct: answers[1].select === answers[0].isHuman,
    };

    // スコア計算: 自分が正解したら1点、＋相手が不正解だったら1点
    const scores = {
      player1Score: corrects.player1Correct
        ? 1 + (corrects.player2Correct ? 0 : 1)
        : 0,
      player2Score: corrects.player2Correct
        ? 1 + (corrects.player1Correct ? 0 : 1)
        : 0,
    };

    // バトル時間計算
    const end = Date.now();
    const startSnapshot = await db.ref(DATABASE_PATHS.startBattle(ids)).get();
    const startTime = startSnapshot.val();
    const time = end - startTime;

    // 結果を構築
    const result: BattleResult = {
      corrects: [corrects.player1Correct, corrects.player2Correct],
      scores: [scores.player1Score, scores.player2Score],
      answers: answers,
      time: time,
    };

    // Firebase Realtime Databaseに結果を保存
    await db.ref(DATABASE_PATHS.result(ids)).set(result);
    await db.ref(DATABASE_PATHS.endBattle(ids)).update(end);
    await db.ref(DATABASE_PATHS.status(ids)).set("finished");

    // レーティングの更新
    await updateRating(firstAnswer.playerId, scores.player1Score);
    await updateRating(secondAnswer.playerId, scores.player2Score);

    // バトルルームデータのバックアップ
    await saveBattleRoomDataToStore(ids);

    // バトルルームデータの削除
    removeBattleRoomData(ids);
  }
);

const updateRating = async (userId: string, score: number) => {
  // レーティングの更新処理
  const ref = firestore().collection("profiles").doc(userId);
  await firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(ref);
    if (!doc.exists) {
      //ゲスト
    } else {
      const currentRating = doc.data()?.rating || 0;
      transaction.update(ref, { rating: currentRating + score });
    }
  });
};

/**
 * ルームデータをFirestoreにバックアップ
 * @param ids バトルルームID
 */
const saveBattleRoomDataToStore = async (ids: BattleRoomIds) => {
  if (!ids) {
    throw new functions.https.HttpsError("invalid-argument", "idsが必要です。");
  }

  try {
    const roomRef = db.ref(DATABASE_PATHS.battleRoom(ids));
    const snapshot = await roomRef.once("value");
    const roomData = snapshot.val();

    if (!roomData) {
      throw new functions.https.HttpsError(
        "not-found",
        "データが見つかりません。"
      );
    }

    const firestoreRef = firestore()
      .collection("backup")
      .doc("battleRooms")
      .collection(ids.battleRoomId)
      .doc();

    await firestoreRef.set(roomData);
    console.log(`Firestoreへの保存が成功しました: roomId ${ids}`);
    return {
      success: true,
      message: `Firestoreへの保存が成功しました: roomId ${ids}`,
    };
  } catch (error) {
    console.error("Firestoreへのバックアップ中にエラーが発生しました:", error);
    throw new functions.https.HttpsError(
      "internal",
      "バックアップ中にエラーが発生しました。"
    );
  }
};

// /**
//  * ルームデータをFirestoreにバックアップ
//  * @param roomId ルームID
//  */
// const saveRoomDataToStore = async (roomId: string) => {
//   if (!roomId) {
//     throw new functions.https.HttpsError(
//       "invalid-argument",
//       "roomIdが必要です。"
//     );
//   }

//   try {
//     const roomRef = db.ref(DATABASE_PATHS.room(roomId));
//     const snapshot = await roomRef.once("value");
//     const roomData = snapshot.val();

//     if (!roomData) {
//       throw new functions.https.HttpsError(
//         "not-found",
//         "データが見つかりません。"
//       );
//     }

//     const firestoreRef = firestore()
//       .collection("backup")
//       .doc("rooms")
//       .collection(roomId)
//       .doc();

//     await firestoreRef.set(roomData);
//     console.log(`Firestoreへの保存が成功しました: roomId ${roomId}`);
//     return {
//       success: true,
//       message: `Firestoreへの保存が成功しました: roomId ${roomId}`,
//     };
//   } catch (error) {
//     console.error("Firestoreへのバックアップ中にエラーが発生しました:", error);
//     throw new functions.https.HttpsError(
//       "internal",
//       "バックアップ中にエラーが発生しました。"
//     );
//   }
// };

// /**
//  * ルームデータをFirebase Storageにバックアップ
//  * @param roomId ルームID
//  */
// const saveRoomDatToStorage = async (roomId: string) => {
//   if (!roomId) {
//     throw new functions.https.HttpsError(
//       "invalid-argument",
//       "roomIdが必要です。"
//     );
//   }

//   try {
//     const roomRef = db.ref(DATABASE_PATHS.room(roomId));
//     const snapshot = await roomRef.once("value");
//     const roomData = snapshot.val();

//     if (!roomData) {
//       throw new functions.https.HttpsError(
//         "not-found",
//         "データが見つかりません。"
//       );
//     }

//     const jsonData = JSON.stringify(roomData);
//     const buffer = Buffer.from(jsonData);
//     const filePath = `backups/room_data/${roomId}_backup_${Date.now()}.json`;
//     const file = storage.bucket().file(filePath);

//     await file.save(buffer, { metadata: { contentType: "application/json" } });
//     console.log(`Firebase Storageへのバックアップが成功しました: ${filePath}`);
//     return {
//       success: true,
//       message: `バックアップが成功しました: ${filePath}`,
//     };
//   } catch (error) {
//     console.error(
//       "Firebase Storageへのバックアップ中にエラーが発生しました:",
//       error
//     );
//     throw new functions.https.HttpsError(
//       "internal",
//       "バックアップ中にエラーが発生しました。"
//     );
//   }
// };

/**
 * ルームデータを削除
 * @param roomId ルームID
 */
const removeRoomData = async (roomId: string) => {
  if (!roomId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "roomIdが必要です。"
    );
  }

  try {
    await db.ref(DATABASE_PATHS.room(roomId)).remove();
    console.log(`ルームデータの削除が成功しました: ${roomId}`);
    return {
      success: true,
      message: `ルームデータの削除が成功しました: ${roomId}`,
    };
  } catch (error) {
    console.error("ルームデータの削除中にエラーが発生しました:", error);
    throw new functions.https.HttpsError(
      "internal",
      "データ削除中にエラーが発生しました。"
    );
  }
};

/**
 * バトルルームデータを削除
 * @param roomId バトルルームID
 */
export const removeBattleRoomData = async (ids: BattleRoomIds) => {
  if (!ids) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "roomIdが必要です。"
    );
  }

  try {
    await db.ref(DATABASE_PATHS.battleRoom(ids)).remove();
    console.log(`ルームデータの削除が成功しました: ${ids}`);
    return {
      success: true,
      message: `ルームデータの削除が成功しました: ${ids}`,
    };
  } catch (error) {
    console.error("ルームデータの削除中にエラーが発生しました:", error);
    throw new functions.https.HttpsError(
      "internal",
      "データ削除中にエラーが発生しました。"
    );
  }
};
