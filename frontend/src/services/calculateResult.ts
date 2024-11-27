import { DATABASE_PATHS } from "../shared/database-paths.ts";
import { BattleResult, SubmitAnswer } from "../shared/types.ts";
import { auth, db, firestore } from "./firebase_f.ts";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  runTransaction,
  addDoc,
} from "firebase/firestore";
import { ref, set, get, child, remove } from "firebase/database";

/** バトル結果を計算
 * @param battleId リクエスト
 */
export const calculateResultFunction = async (battleId: string) => {
  const playerId = auth.currentUser?.uid;

  if (!battleId) {
    console.error("invalid-argument", "roomIdが必要です。");
  }

  const answersSnapshot = await get(
    ref(db, DATABASE_PATHS.submittedAnswers(battleId))
  );

  if (!answersSnapshot.exists()) {
    console.error("not-found", "回答が見つかりませんでした。");
  }
  console.log("answersSnapshot", answersSnapshot.val());
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
  const snapshot = await get(
    child(ref(db), DATABASE_PATHS.timestamps(battleId))
  );
  const startTime = snapshot.val().start;
  const timeData = { start: startTime, end: end };

  const time = end - startTime;

  // 結果を構築
  const result: BattleResult = {
    corrects: [corrects.player1Correct, corrects.player2Correct],
    scores: [scores.player1Score, scores.player2Score],
    answers: answers,
    time: time,
  };

  // Firebase Realtime Databaseに結果を保存
  await set(ref(db, DATABASE_PATHS.result(battleId)), result);
  await set(ref(db, DATABASE_PATHS.timestamps(battleId)), timeData);
  await set(ref(db, DATABASE_PATHS.status(battleId)), "finished");

  // レーティングの更新
  //   await updateRating(firstAnswer.playerId, scores.player1Score);
  //   await updateRating(secondAnswer.playerId, scores.player2Score);

  // バトルルームデータのバックアップ
  await saveBattleRoomDataToStore(battleId);

  // バトルルームデータの削除
  removeBattleRoomData(battleId);
};

/** ルームデータをFirestoreにバックアップ
 * @param battleId バトルルームID
 */
const saveBattleRoomDataToStore = async (battleId: string) => {
  if (!battleId) {
    console.error("invalid-argument", "battleIdが必要です。");
  }
  console.log("battleIzetsrdxfcgjhvjbknld");

  try {
    const roomRef = ref(db, DATABASE_PATHS.battleRoom(battleId));
    const snapshot = await get(roomRef);
    const roomData = snapshot.val();

    if (roomData) {
      const firestoreRef = collection(
        firestore,
        DATABASE_PATHS.backup_battle(battleId)
      );
      await addDoc(firestoreRef, roomData);
      console.log(`Firestoreへの保存が成功しました: roomId ${battleId}`);
      return {
        success: true,
        message: `Firestoreへの保存が成功しました: roomId ${battleId}`,
      };
    }
  } catch (error) {
    console.error("Firestoreへのバックアップ中にエラーが発生しました:", error);
  }
};

/** バトルルームデータを削除
 * @param roomId バトルルームID
 */
export const removeBattleRoomData = async (battleId: string) => {
  if (!battleId) {
    console.error("invalid-argument", "roomIdが必要です。");
  }

  try {
    await remove(ref(db, DATABASE_PATHS.battleRoom(battleId)));
    console.log(`ルームデータの削除が成功しました: ${battleId}`);
    return {
      success: true,
      message: `ルームデータの削除が成功しました: ${battleId}`,
    };
  } catch (error) {
    console.error("ルームデータの削除中にエラーが発生しました:", error);
  }
};
