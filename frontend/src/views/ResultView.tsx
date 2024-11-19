// frontend/src/views/ResultView.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ResultData } from "../shared/types";

export interface ResultViewProps {
  resultData: ResultData;
}

const ResultView: React.FC = () => {
  //#region init
  const location = useLocation();
  const { resultData } = location.state as ResultViewProps;
  const navigate = useNavigate();
  //#endregion

  const toHomeSegue = () => {
    navigate("/");
  };

  return (
    <div>
      <h2>ゲーム結果</h2>

      <p>
        <strong>勝敗:</strong>{" "}
        {resultData.win === "win"
          ? "勝ち！"
          : resultData.win === "lose"
            ? "負け..."
            : "引き分け"}
      </p>
      <p>
        <strong>バトルスコア:</strong> {resultData.score}
      </p>
      <p>
        <strong>バトル時間:</strong> {resultData.time} ms
      </p>

      <h3>判定</h3>
      <ul>
        <li>自分: {resultData.corrects[0] ? "正解" : "不正解"}</li>
        <li>相手: {resultData.corrects[1] ? "正解" : "不正解"}</li>
      </ul>

      <h3>自分の回答</h3>
      <p>
        <strong>Identity:</strong> {resultData.myAnswer.isHuman ? "人間" : "AI"}
      </p>
      <p>
        <strong>Selection:</strong> {resultData.myAnswer.select ? "人間" : "AI"}
      </p>
      <p>
        <strong>理由:</strong> {resultData.myAnswer.message || "No message"}
      </p>

      <h3>相手の回答</h3>
      <p>
        <strong>Identity:</strong>{" "}
        {resultData.opponentAnswer.isHuman ? "人間" : "AI"}
      </p>
      <p>
        <strong>Selection:</strong>{" "}
        {resultData.opponentAnswer.select ? "人間" : "AI"}
      </p>
      <p>
        <strong>理由:</strong>{" "}
        {resultData.opponentAnswer.message || "No message"}
      </p>
      <Link to="/">
        <button>バトル終了</button>
      </Link>
      {/* TODO ルームへ */}
    </div>
  );
};

export default ResultView;
