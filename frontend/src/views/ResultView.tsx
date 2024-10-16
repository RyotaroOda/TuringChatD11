import React from "react";
import { Link } from "react-router-dom";

const ResultView: React.FC = () => {
  const playerAnswers: string[] = ["Answer1", "Answer2"]; // Example data
  const opponentAnswers: string[] = ["Answer1", "Answer2"]; // Example data
  const playerSuccess: boolean[] = [true, false]; // Example data
  const opponentSuccess: boolean[] = [true, true]; // Example data
  const playerScore: number = 1000; // Example data
  const battleScore: number = 50; // Example data

  const handleGoHome = () => {
    console.log("Navigating to HomeView...");
    // Implement navigation logic here
  };

  return (
    <div>
      <h1>リザルト画面</h1>
      <div>
        <h2>自分の回答と成否</h2>
        <ul>
          {playerAnswers.map((answer, index) => (
            <li key={index}>
              {answer} - {playerSuccess[index] ? "成功" : "失敗"}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>相手の回答と成否</h2>
        <ul>
          {opponentAnswers.map((answer, index) => (
            <li key={index}>
              {answer} - {opponentSuccess[index] ? "成功" : "失敗"}
            </li>
          ))}
        </ul>
      </div>
      <p>バトルスコア: {battleScore}</p>
      <p>プレイヤースコア: {playerScore + battleScore}</p>
      <Link to="/">
        <button onClick={handleGoHome}>ホームへ</button>
      </Link>
    </div>
  );
};

export default ResultView;
