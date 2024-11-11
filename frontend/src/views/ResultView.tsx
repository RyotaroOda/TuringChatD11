import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "../services/firebase_f.ts";
import { ResultData } from "shared/dist/types";

const ResultView: React.FC = () => {
  const [isViewLoaded, setIsLoaded] = useState<boolean>(false);

  const user = auth.currentUser;
  const myId = user?.uid || "error";

  // Location and Params
  const location = useLocation();
  const result: ResultData = location.state.resultData;
  console.log("ResultView result:", result);
  const handleGoHome = () => {
    console.log("Navigating to HomeView...");
    // Implement navigation logic here
  };

  return (
    <div>
      <h2>ゲーム結果</h2>

      <p>
        <strong>勝敗:</strong>{" "}
        {result.win === "win"
          ? "勝ち！"
          : result.win === "lose"
            ? "負け..."
            : "引き分け"}
      </p>
      <p>
        <strong>バトルスコア:</strong> {result.score}
      </p>
      <p>
        <strong>バトル時間:</strong> {result.time} ms
      </p>

      <h3>判定</h3>
      <ul>
        <li>自分: {result.corrects[0] ? "正解" : "不正解"}</li>
        <li>相手: {result.corrects[1] ? "正解" : "不正解"}</li>
      </ul>

      <h3>自分の回答</h3>
      <p>
        <strong>Identity:</strong> {result.myAnswer.identity ? "人間" : "AI"}
      </p>
      <p>
        <strong>Selection:</strong> {result.myAnswer.select ? "人間" : "AI"}
      </p>
      <p>
        <strong>理由:</strong> {result.myAnswer.message || "No message"}
      </p>

      <h3>相手の回答</h3>
      <p>
        <strong>Identity:</strong>{" "}
        {result.opponentAnswer.identity ? "人間" : "AI"}
      </p>
      <p>
        <strong>Selection:</strong>{" "}
        {result.opponentAnswer.select ? "人間" : "AI"}
      </p>
      <p>
        <strong>理由:</strong> {result.opponentAnswer.message || "No message"}
      </p>
      <Link to="/">
        <button>バトル終了</button>
      </Link>
    </div>
  );
};

export default ResultView;
