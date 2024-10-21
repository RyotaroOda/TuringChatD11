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
// Firestoreのインスタンス取得 (必要に応じて)
export const firestore = getFirestore();
//認証情報のインスタンス取得
export const auth = admin.auth();
