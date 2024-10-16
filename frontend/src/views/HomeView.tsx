import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  requestMatch,
  onMatchFound,
} from "../services/FRD.ts";
import { useAuth } from "../services/useAuth.tsx"; // useAuthフックをインポート
import { signOut } from "firebase/auth"; // Firebaseのログアウト機能をインポート
import { auth } from "../services/firebase.ts"; // Firebaseの認証インスタンスをインポート
import { onAuthStateChanged } from "firebase/auth"; // Firebaseの認証状態確認

const HomeView: React.FC = () => {
  const [playerScore, setPlayerScore] = useState<number>(9999);
  const [aiPrompt, setAiPrompt] = useState<string>("Input AI prompt here");
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>(""); // プレイヤーネームを保持
  const navigate = useNavigate();

  const { user } = useAuth(); // useAuthフックで認証状態を取得

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

  // マッチング開始
  const startMatch = (): void => {
    setIsMatching(true);
    requestMatch();

    // マッチング成功時にバトル画面へ遷移
    onMatchFound((data) => {
      console.log("Match found with opponent:", data.opponentId);
      navigate(`/battle/${data.roomId}`, {
        state: { matchData: data, myData: { playerName, playerScore, aiPrompt } },
      });
      setIsMatching(false);
    });
  };

  return (
    <div>
      <h1>ホーム</h1>
      {/* ログイン状態による表示の切り替え */}
      {user ? (
        <div>
          <p>
            こんにちは、{playerName}さん {/* ログイン状態に基づいて名前を表示 */}
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
          <button onClick={() => navigate("/login")}>ログイン</button> {/* ログインボタン */}
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

      <button onClick={startMatch} disabled={isMatching}>
        {isMatching ? "Matching..." : "Start Matching"}
      </button>
    </div>
  );
};

export default HomeView;