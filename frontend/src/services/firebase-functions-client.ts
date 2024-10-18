// services/firebase-functions-client.ts
import { httpsCallable } from "firebase/functions";
import { auth, funcs } from "./firebase_f.ts"; // Firebase初期化ファイルをインポート
import { MatchResult } from "../../../shared/types";

// サーバーレス関数を使ってマッチングリクエストを送信する関数
export const requestMatch = async (rating: number): Promise<MatchResult> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const requestMatchFunction = httpsCallable<{ rating: number }, MatchResult>(
    funcs,
    "requestMatchFunction"
  );
  console.log("requestMatchFunction", requestMatchFunction);
  const result = await requestMatchFunction({ rating });

  return result.data;
};

// サーバーレス関数を使ってマッチングキャンセルを行う関数
export const cancelMatch = async (): Promise<MatchResult> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const cancelMatchFunction = httpsCallable<{ rating: number }, MatchResult>(
    funcs,
    "cancelMatchFunction"
  );
  const result = await cancelMatchFunction();
  return result.data;
};
