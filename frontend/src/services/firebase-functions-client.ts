// services/firebase-functions-client.ts
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebase_f.ts"; // Firebase初期化ファイルをインポート
import { MatchResult } from "../../../shared/types";

// サーバーレス関数を使ってマッチングリクエストを送信する関数
export const requestMatch = async (rating: number): Promise<MatchResult> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインしていないユーザーです。");
  }
  // const requestMatchFunction = httpsCallable<{ rating: number }, MatchResult>(
  //   functions,
  //   "requestMatchFunction"
  // );
  // console.log("requestMatchFunction wait", requestMatchFunction);
  // const result = await requestMatchFunction({ rating }); //FIXME:ここ！
  // console.log("requestMatchFunction waited");

  const requestMatchFunction = httpsCallable(functions, "requestMatchFunction");
  console.log("requestMatchFunction", requestMatchFunction);
  const jaison = await requestMatchFunction({ rating })
    .then((result) => {
      const data = result.data;
      console.log("data", data);
    })
    .catch((error) => {
      console.log("エラー");
      console.error(error);
    });
  console.log("requestMatchFunction fin");
  const result = { roomId: "test", opponentId: "test" };
  return result;
};

// サーバーレス関数を使ってマッチングキャンセルを行う関数
export const cancelMatch = async (): Promise<MatchResult> => {
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
