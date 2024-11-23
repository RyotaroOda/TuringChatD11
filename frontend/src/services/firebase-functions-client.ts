// services/firebase-functions-client.ts
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebase_f.ts"; // Firebase初期化ファイルをインポート
import { PlayerData, MatchResult } from "../shared/types.ts";
import { BattleRoomIds } from "../shared/database-paths.ts";

//#region HomeView

/**
 * マッチングリクエストを送信する関数
 * - Firebase Functions を使用
 * - 再試行をサポート
 *
 * @param player プレイヤーデータ
 * @param retryCount 最大再試行回数（デフォルト: 10回）
 * @returns マッチング結果
 */
export const requestMatch = async (
  player: PlayerData,
  retryCount = 10
): Promise<MatchResult> => {
  const requestMatchFunction = httpsCallable(functions, "requestMatchFunction");
  const TIMEOUT_DURATION = 60000; // 60秒タイムアウト
  let attempt = 0;

  while (attempt < retryCount) {
    attempt += 1;
    try {
      const result: MatchResult = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(
          () => reject({ message: "マッチングタイムアウト" }),
          TIMEOUT_DURATION
        );

        requestMatchFunction(player)
          .then((response) => {
            clearTimeout(timeoutId); // タイムアウトをクリア
            resolve(response.data as MatchResult);
          })
          .catch((error) => {
            clearTimeout(timeoutId); // タイムアウトをクリア
            reject({ message: error.message });
          });
      });

      // 成功した場合、結果を返す
      return result;
    } catch (error) {
      console.error(`マッチングエラー（試行${attempt}回目）:`, error);

      if (attempt >= retryCount) {
        return {
          ids: { roomId: "", battleRoomId: "" },
          startBattle: false,
          message: `マッチング失敗（試行${attempt}回目）: ${error.message}`,
        };
      }

      // Exponential Backoff (指数バックオフ)
      const backoffTime = Math.pow(2, attempt) * 1000;
      console.log(`バックオフ: ${backoffTime / 1000}秒後に再試行`);
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }

  // 再試行が全て失敗した場合
  return {
    ids: { roomId: "", battleRoomId: "" },
    startBattle: false,
    message: "再試行失敗",
  };
};

/**
 * マッチングリクエストをキャンセルする関数
 * - Firebase Functions を使用
 *
 * @throws 未ログインエラー
 */
export const cancelRequest = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const cancelMatchFunction = httpsCallable(functions, "cancelMatchFunction");
  try {
    await cancelMatchFunction();
    console.log("マッチングリクエストがキャンセルされました");
  } catch (error) {
    console.error("マッチングキャンセルエラー:", error);
    throw new Error("マッチングキャンセル中にエラーが発生しました。");
  }
};

//#endregion

//#region BattleView

/**
 * バトル結果を計算する関数
 * - Firebase Functions を使用
 *
 * @param roomId バトルルームID
 * @throws 未ログインエラー
 */
export const calculateResult = async (ids: BattleRoomIds) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }

  const func = httpsCallable(functions, "calculateResultFunction");

  try {
    console.log("バトル結果の計算を開始します:", ids);
    func(ids); // 非同期実行、応答を待たない
  } catch (error) {
    console.error("バトル結果計算エラー:", error);
    throw new Error("バトル結果の計算中にエラーが発生しました。");
  }
};

//#endregion
