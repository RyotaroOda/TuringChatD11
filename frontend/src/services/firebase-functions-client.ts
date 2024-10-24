// services/firebase-functions-client.ts
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebase_f.ts"; // Firebase初期化ファイルをインポート
import { PlayerData, MatchResult } from "shared/dist/types";

// サーバーレス関数を使ってマッチングリクエストを送信する関数
export const requestMatch = async (
  player: PlayerData,
  retryCount = 3
): Promise<MatchResult> => {
  const requestMatchFunction = httpsCallable(functions, "requestMatchFunction");

  const TIMEOUT_DURATION = 60000; // 60秒待機してもマッチングしなければタイムアウト
  let timeoutId;
  let attempt = 0;

  while (attempt < retryCount) {
    attempt += 1;
    try {
      // マッチングリクエストを送信
      const result: MatchResult = await new Promise((resolve, reject) => {
        timeoutId = setTimeout(
          () => reject({ message: "マッチングタイムアウト" }),
          TIMEOUT_DURATION
        );
        requestMatchFunction(player)
          .then((response) => {
            // マッチング成功時
            clearTimeout(timeoutId); // タイムアウトをクリア
            resolve(response.data as MatchResult);
          })
          .catch((error) => {
            // マッチング失敗時
            clearTimeout(timeoutId); // タイムアウトをクリア
            reject({ message: error.message });
          });
      });
      return result;
    } catch (error) {
      console.error(
        `マッチングエラーまたはタイムアウト（試行${attempt}回目）:`,
        error
      );
      if (attempt < retryCount) {
        // Exponential Backoff (指数バックオフ)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      } else {
        return {
          roomId: "",
          startBattle: false,
          message: `マッチングエラーまたはタイムアウト（試行${attempt}回目）:`,
        };
      }
    }
  }
  // 再試行失敗時の結果
  return {
    roomId: "",
    startBattle: false,
    message: "再試行失敗",
  };
};

// サーバーレス関数を使ってマッチングキャンセルを行う関数
export const cancelRequest = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const cancelMatchFunction = httpsCallable(functions, "cancelMatchFunction");
  await cancelMatchFunction();
};
