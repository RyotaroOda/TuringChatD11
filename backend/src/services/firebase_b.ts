import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config(); // 環境変数のロード

export const initFirebase = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FD_PROJECT_ID,
    clientEmail: process.env.FD_CLIENT_EMAIL,
    privateKey: process.env.FD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  databaseURL: process.env.FD_DATABASE_URL, // Realtime DatabaseのURLを.envから取得
});

// Realtime Databaseのインスタンス取得
export const db = admin.database();

// 初期化処理：Realtime Database の初期化
const initializeDatabase = async () => {
  try {
    // 初期化するデータ構造 (例：rooms, waitingPlayers などをクリア)
    const initialData = {
      rooms: null, // 全ルームデータを削除
      randomMatching: null, // 待機中のプレイヤーデータを削除
    };

    // Firebase Realtime Database に初期データを設定
    await db.ref().set(initialData);
    console.log("Realtime Database の初期化が完了しました。");
    console.log("Firebase Functions 準備中...ちょっとまってね...");
  } catch (error) {
    console.error("Realtime Database の初期化中にエラーが発生しました:", error);
  }
};
// サーバー起動時に初期化処理を実行
// initializeDatabase();

// Firestoreのインスタンス取得 (必要に応じて)
export const firestore = getFirestore();
//認証情報のインスタンス取得
export const auth = admin.auth();
