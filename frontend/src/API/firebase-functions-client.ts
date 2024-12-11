// services/firebase-functions-client.ts
import { httpsCallable } from "firebase/functions";
import { db } from "./firebase_f.ts"; // Firebase初期化ファイルをインポート
import { ref, get, remove } from "firebase/database";
import { auth, functions } from "./firebase_f.ts"; // Firebase初期化ファイルをインポート
import { PlayerData, MatchResult } from "../shared/types.ts";
import { variables } from "../App.tsx";
import { DATABASE_PATHS } from "../shared/database-paths.ts";
import { calculateResultFunction } from "./frontFunctions/calculateResult.ts";
import { matching } from "./frontFunctions/matching.ts";
import { ChatGPTRequest } from "./chatGPT_f.ts";

//#region HomeView

/** マッチングリクエストを送信する関数
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
  if (!variables.backend) {
    return await matching(player);
  } else {
    const requestMatchFunction = httpsCallable(
      functions,
      "requestMatchFunction"
    );
    const TIMEOUT_DURATION = 6000; // 6秒タイムアウト
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
            battleId: "",
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
      battleId: "",
      startBattle: false,
      message: "再試行失敗",
    };
  }
};

/** マッチングリクエストをキャンセルする関数
 * - Firebase Functions を使用
 *
 * @throws 未ログインエラー
 */
//Functions使わない
export const cancelRequest = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }
  const userId = user.uid;
  const waitingRef = ref(db, DATABASE_PATHS.waitingPlayers + "/" + userId);
  const snapshot = await get(waitingRef);
  if (snapshot.val()?.battleId) {
    await remove(ref(db, DATABASE_PATHS.battleRoom(snapshot.val()?.battleId)));
  }
  await remove(waitingRef);
};

//#endregion

//#region BattleView

/** バトル結果を計算する関数
 * - Firebase Functions を使用
 *
 * @param roomId バトルルームID
 * @throws 未ログインエラー
 */
export const calculateResult = async (battleId: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }
  if (!variables.backend) {
    await calculateResultFunction(battleId);
  } else {
    const func = httpsCallable(functions, "calculateResultFunction");

    try {
      console.log("バトル結果の計算を開始します:", battleId);
      func(battleId); // 非同期実行、応答を待たない
    } catch (error) {
      console.error("バトル結果計算エラー:", error);
    }
  }
};

export const generateMessageBack = async (messages: ChatGPTRequest) => {
  const func = httpsCallable(functions, "generateMessageFunction");
  try {
    const response = await func({ messages });
    const out = response.data as string;
    return out;
  } catch (error) {
    console.error("Failed to generate message:", error);
    throw new Error("Failed to generate message.");
  }
};

export const generateImageBack = async (
  prompt: string
): Promise<Base64URLString> => {
  const func = httpsCallable(functions, "generateImageFunction");
  try {
    const response = await func({ prompt });
    const out = response.data as Base64URLString;
    return out;
  } catch (error) {
    console.error("Failed to generate image:", error);
    throw new Error("Failed to generate image.");
  }
};

//#endregion
