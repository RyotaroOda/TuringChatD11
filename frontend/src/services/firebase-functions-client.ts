// services/firebase-functions-client.ts
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebase_f.ts"; // Firebase初期化ファイルをインポート
import { MatchResult } from "../../../shared/types";

// サーバーレス関数を使ってマッチングリクエストを送信する関数
export const requestMatch = async (): Promise<MatchResult> => {
  const requestMatchFunction = httpsCallable(functions, "requestMatchFunction");

  const TIMEOUT_DURATION = 60000; // 60秒待機してもマッチングしなければタイムアウト
  let timeoutId;

  try {
    const result: MatchResult = await new Promise((resolve, reject) => {
      timeoutId = setTimeout(
        () => reject({ message: "マッチングタイムアウト" }),
        TIMEOUT_DURATION
      );
      requestMatchFunction()
        .then((response) => {
          clearTimeout(timeoutId); // タイムアウトをクリア
          resolve(response.data as MatchResult);
        })
        .catch((error) => {
          clearTimeout(timeoutId); // タイムアウトをクリア
          reject({ message: error.message });
        });
    });

    return result;
  } catch (error) {
    console.error("マッチングエラーまたはタイムアウト:", error);
    return { roomId: "", opponentId: "", message: error.message };
  }
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
