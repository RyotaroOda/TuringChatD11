import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";


// フロントエンド用にREACT_APP_プレフィックスをつけた環境変数を使う
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig);

// Realtime Databaseインスタンスを作成
export const db = getDatabase(app);

// Firebase Authenticationのインスタンスを作成
export const auth = getAuth(app);

// 匿名認証を行う関数
export const signInAnonymouslyUser = () => {
  return signInAnonymously(auth)
    .then((userCredential) => {
      // 認証に成功した場合の処理
      console.log("Signed in anonymously:", userCredential.user);
    })
    .catch((error) => {
      // 認証に失敗した場合の処理
      console.error("Anonymous sign-in failed:", error);
    });
};
