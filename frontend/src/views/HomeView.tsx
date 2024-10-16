import React, { useState,  useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { savePlayerName, requestMatch } from "../services/FRD.ts";
import { signInAnonymouslyUser } from "../services/firebase.ts";

interface MyData {
  playerName: string;
  playerScore: number;
  aiPrompt: string;
}

const HomeView: React.FC = () => {
  const [playerName, setPlayerName] = useState<string>("");
  const [playerScore, setPlayerScore] = useState<number>(9999);
  const [aiPrompt, setAiPrompt] = useState<string>("Input AI prompt here");
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);  // 認証状態

  const navigate = useNavigate();

   // 匿名認証の処理
   useEffect(() => {
    signInAnonymouslyUser()
      .then(() => {
        setIsAuthenticated(true);  // 認証に成功したら、状態を更新
      })
      .catch((error) => {
        console.error("Anonymous authentication failed:", error);
        setIsAuthenticated(false);
      });
  }, []);

  // マッチングの処理
  const startMatch = async (): Promise<void> => {
    if (isAuthenticated) {  // 認証が成功している場合のみ実行
      const playerId = "uniquePlayerId";  // プレイヤーIDは認証時に取得可能な場合もありますが、例として固定値
      const nameToSave = playerName === "" ? "ゲスト" : playerName;
      setPlayerName(nameToSave);

      // Firebaseにプレイヤー名を保存
      await savePlayerName(playerId, nameToSave);

      // Firebaseにマッチングリクエストを送信
      setIsMatching(true);
      const roomId = await requestMatch(playerId);  // マッチング成功でルームID取得（仮実装）

      const myData: MyData = {
        playerName: nameToSave,
        playerScore,
        aiPrompt,
      };

      // マッチングが成功したらバトル画面へ遷移
      navigate(`/battle/${playerId}`, {
        state: { matchData: { roomId: "room123", opponentId: "opponentId", opponentName: "Opponent" }, myData },
      });
      
      setIsMatching(false);
    }else {
      console.log("User is not authenticated. Please sign in.");
    }
  };

  // html
  return (
    <div>
      <h1>ホーム</h1>
      {isAuthenticated ? (  // 認証済みの場合に表示する内容
        <>
          <p>Player Name: {playerName}</p>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
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
        </>
      ) : (
        <p>Signing in...</p>  // 認証中の場合に表示する内容
      )}
    </div>
  );
};

export default HomeView;
