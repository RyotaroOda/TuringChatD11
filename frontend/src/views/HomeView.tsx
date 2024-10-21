import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  onRoomUpdate,
  removeFromWaitingList,
} from "../services/firebase-realtime-database.ts";
import {
  requestMatch,
  cancelMatch,
} from "../services/firebase-functions-client.ts"; // Firebase Functionsの呼び出しをインポート

import { useAuth } from "../services/useAuth.tsx"; // useAuthフックをインポート
import { signOut } from "firebase/auth"; // Firebaseのログアウト機能をインポート
import { auth } from "../services/firebase_f.ts"; // Firebaseの認証インスタンスをインポート
import { onAuthStateChanged } from "firebase/auth"; // Firebaseの認証状態確認
import { MatchResult } from "../../../shared/types";

const HomeView: React.FC = () => {
  const [playerScore, setPlayerScore] = useState<number>(9999);
  const [aiPrompt, setAiPrompt] = useState<string>("Input AI prompt here");
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string | null>(null); // ルームID
  const [playerName, setPlayerName] = useState<string>(""); // プレイヤーネームを保持

  const navigate = useNavigate();
  const { user } = useAuth(); // useAuthフックで認証状態を取得

  //#region ログイン状態
  useEffect(() => {
    if (user) {
      // ログイン済みユーザーならFirebaseからプレイヤー名を取得
      if (user.isAnonymous) {
        setPlayerName("ゲスト"); // 匿名ユーザーの場合はゲスト表示
      } else if (user.displayName) {
        setPlayerName(user.displayName); // 名前が登録されている場合は表示
      } else {
        setPlayerName(user.email || ""); // 名前がない場合はメールアドレスを表示
      }
    }
  }, [user]);

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("ログアウトしました");
      navigate("/login"); // ログアウト後にログイン画面にリダイレクト
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };
  //#endregion

  //#region マッチング
  // マッチング開始処理
  const startMatch = async () => {
    setIsMatching(true); // マッチング状態を設定
    try {
      const result = await requestMatch(); // サーバーレス関数でマッチングリクエスト
      if (result.roomId) {
        setRoomId(result.roomId); // ルームIDを保存
        console.log(result.message);
      } else {
        console.error("マッチングエラー1");
        setIsMatching(false);
      }
    } catch (error) {
      console.error("マッチングエラー2:", error);
      setIsMatching(false); // エラー発生時にマッチング状態を解除
    }
  };

  // マッチングキャンセル処理
  const handleCancelMatch = async () => {
    setIsMatching(false); // マッチング状態を解除
    try {
      const result = await cancelMatch(); // サーバーレス関数でキャンセル
      console.log(result.message);
    } catch (error) {
      console.error("キャンセルエラー:", error);
    }
  };

  // プレイヤーが画面を閉じたりリロードした場合の待機リスト削除
  useEffect(() => {
    const handleUnload = async () => {
      if (isMatching) {
        await removeFromWaitingList(); // ロード/画面遷移時に待機リストから削除
        console.log(
          "画面リロードまたは遷移により待機リストから削除されました。"
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload); // ブラウザを閉じるまたはリロード時に実行
    return () => {
      window.removeEventListener("beforeunload", handleUnload); // クリーンアップ
    };
  }, [isMatching]);
  //#endregion

  return (
    <div>
      <h1>ホーム</h1>
      {/* ログイン状態による表示の切り替え */}
      {user ? (
        <div>
          <p>
            こんにちは、{playerName}さん{" "}
            {/* ログイン状態に基づいて名前を表示 */}
          </p>
          {/* 匿名ユーザーなら「ログイン」ボタンを表示 */}
          {user.isAnonymous ? (
            <button onClick={() => navigate("/login")}>ログイン</button>
          ) : (
            <button onClick={handleLogout}>ログアウト</button>
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => navigate("/login")}>ログイン</button>{" "}
          {/* ログインボタン */}
        </div>
      )}

      {/* プレイヤーネームの入力はログイン済みユーザーのみ表示 */}
      {user && !user.isAnonymous ? null : (
        <div>
          <p>PlayerName: ゲスト</p>
        </div>
      )}

      <p>Score: {playerScore}</p>
      <div>
        <label>
          AIプロンプト:
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
        </label>
      </div>

      {/* マッチング中にキャンセルボタンを表示 */}
      {isMatching ? (
        <button onClick={handleCancelMatch}>キャンセル</button> // マッチングキャンセルボタン
      ) : (
        <button onClick={startMatch}>Start Matching</button> // マッチング開始ボタン
      )}
      {isMatching ? <p>"Matching ..."</p> : <p></p>}
    </div>
  );
};

export default HomeView;
