import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

// Firestoreのインスタンスを作成
export const firestore = getFirestore(app);

// Realtime Databaseインスタンスを作成
export const db = getDatabase(app);

// Firebase Storageのインスタンスを作成
export const storage = getStorage(app);

// Firebase Authenticationのインスタンスを作成
export const auth = getAuth(app);

// Firebase Functionsのインスタンスを作成
export const functions = getFunctions(app);

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

// ローカル開発用エミュレーターの接続設定
if (window.location.hostname === "localhost") {
  // Functionsエミュレーター
  connectFunctionsEmulator(functions, "127.0.0.1", 5001); // ポートはエミュレータのポートに合わせる
  // console.log("Functions emulator connected", functions);

  // #region testFunction
  // const testFunction = httpsCallable(functions, "testFunction");
  // console.log("testFunction", testFunction);
  // try {
  //   const result = await testFunction();
  //   console.log("Function result:", result.data);
  // } catch (error) {
  //   console.error("Error calling test function:", error);
  // }

  // console.log("testFunction fin");
  //#endregion
}

//#region testGetData
// test_dataを取得する関数
// export const getTestData = async (): Promise<any> => {
//   try {
//     const dbRef = ref(db); // データベースのルートを参照
//     const snapshot = await get(child(dbRef, "test_data")); // test_dataノードを取得

//     if (snapshot.exists()) {
//       return snapshot.val(); // データが存在する場合、その値を返す
//     } else {
//       console.error("データが存在しません");
//       return null; // データが存在しない場合はnullを返す
//     }
//   } catch (error) {
//     console.error("データの取得に失敗しました:", error);
//     throw error; // エラーが発生した場合は例外を投げる
//   }
// };
// try {
//   const result = getTestData();
//   console.log("result:", result);
// } catch (error) {
//   console.error("Error calling getTestData:", error);
// }
//#endregion
