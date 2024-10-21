// services/firebase-functions-client.ts
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebase_f.ts"; // Firebase初期化ファイルをインポート
import { MatchResult } from "../../../shared/types";

// サーバーレス関数を使ってマッチングリクエストを送信する関数
export const requestMatch = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }
  const requestMatchFunction = httpsCallable(functions, "requestMatchFunction");
  const result = await requestMatchFunction(); //FIXME:ここ！
  console.log("requestMatchFunction waited", result);
  const matchResult: MatchResult = {
    roomId: "test",
    opponentId: "test",
    message: "test",
  };

  return matchResult;
};

// サーバーレス関数を使ってマッチングキャンセルを行う関数
export const cancelMatch = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const cancelMatchFunction = httpsCallable<{ rating: number }, MatchResult>(
    functions,
    "cancelMatchFunction"
  );
  const result = await cancelMatchFunction();
  return result.data;
};
