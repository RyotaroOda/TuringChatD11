import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
// import * as serviceAccount from '../../firebase-service-account.json';  // サービスアカウントキーのパス
// import { ServiceAccount } from "firebase-admin"; 

dotenv.config();  // 環境変数のロード

export const initFirebase =
  initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL, // Realtime DatabaseのURLを.envから取得
  });

// JSONファイルをrequireで読み込む
// const serviceAccount = require("../../firebase-service-account.json") as ServiceAccount;

// console.log("serviceAccount: ", serviceAccount);

// export const initFirebase = () => {
//     initializeApp({
//       credential: cert(serviceAccount),
//       databaseURL: process.env.FIREBASE_DATABASE_URL, // Realtime DatabaseのURLを.envから取得
//     });
//   };
  

// Realtime Databaseのインスタンス取得
export const db = getDatabase();
// Firestoreのインスタンス取得 (必要に応じて)
export const firestore = getFirestore();
