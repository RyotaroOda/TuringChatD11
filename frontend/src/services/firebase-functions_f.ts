// services/firebase-functions-client.ts
import { httpsCallable } from "firebase/functions";
import { auth, funcs } from "./firebase_f.ts"; // Firebase初期化ファイルをインポート

// マッチングリクエストの結果の型定義
interface MatchResult {
    roomId?: string;
    opponentId?: string;
    message?: string;
  }

  // サーバーレス関数を使ってマッチングリクエストを送信する関数
  export const requestMatch = async (rating: number): Promise<MatchResult> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("ログインしていないユーザーです。");
    }
  
    const requestMatchFunction = httpsCallable(funcs, 'requestMatchFunction');
    const result = await requestMatchFunction({ rating });
    
    // 型アサーションを使ってunknown型からMatchResult型にキャスト
    return result.data as MatchResult;
  };
  
  // キャンセルリクエストの結果の型定義
  interface CancelResult {
    message: string;
  }
  
  // サーバーレス関数を使ってマッチングキャンセルを行う関数
  export const cancelMatch = async (): Promise<CancelResult> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("ログインしていないユーザーです。");
    }
  
    const cancelMatchFunction = httpsCallable(funcs, 'cancelMatchFunction');
    const result = await cancelMatchFunction();
    
    // 型アサーションを使ってunknown型からCancelResult型にキャスト
    return result.data as CancelResult;
  };