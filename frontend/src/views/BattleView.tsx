import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  sendMessage,
  onMessageAdded,
  sendAnswer,
  checkAnswers,
  onResultUpdated,
} from "../services/firebase-realtime-database.ts";
import {
  BattleLog,
  PlayerData,
  RoomData,
  SubmitAnswer,
} from "shared/dist/types";
import { useAuth } from "../services/useAuth.tsx";
import { BattleResult, ResultData } from "shared/src/types.ts";

const BattleView: React.FC = () => {
  //#region init
  const [isViewLoaded, setIsLoaded] = useState<boolean>(false);
  const { roomId } = useParams<{ roomId: string }>();

  const { user } = useAuth();
  const myId = user?.uid || "error";

  // Location and Params
  const location = useLocation();
  const state: RoomData = location.state.roomData;
  const playersKey = Object.keys(state.players);
  const isHost = myId === state.players[0].id;
  const myNumber = isHost ? 0 : 1;
  // const isHost = myId === state.players[playersKey[0]].id;

  const myData: PlayerData = isHost
    ? state.players[playersKey[0]]
    : state.players[playersKey[1]];
  const opponentData: PlayerData = isHost
    ? state.players[playersKey[1]]
    : state.players[playersKey[0]];

  // Player Information
  const myName = `${myData.name} (あなた)` || "error";

  // Battle Configuration
  const battleConfig = state.battleConfig;

  // Player names mapping
  const playerNames: Record<string, string> = {
    [myId]: myName,
    [opponentData.id]: opponentData.name,
  };

  const navigate = useNavigate();
  const [chatLog, setChatLog] = useState<
    { senderId: string; message: string }[]
  >([]);
  const [message, setMessage] = useState<string>("");
  const [isMyTurn, setIsMyTurn] = useState<boolean>(isHost); // Initial turn state (placeholder)
  const [remainTurn, setRemainTurn] = useState<number>(
    state.battleConfig.maxTurn
  );
  const [remainingTime, setRemainingTime] = useState<number>(
    battleConfig.oneTurnTime
  );

  const [answer, setAnswer] = useState<SubmitAnswer>({
    playerId: myId,
    identity: true,
    select: null,
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  //#endregion

  // ViewDidLoad
  useEffect(() => {
    setIsLoaded(true);
  }, [battleConfig]);

  //メッセージ更新
  useEffect(() => {
    if (roomId && isViewLoaded) {
      onMessageAdded(roomId, (newMessage) => {
        console.log("onMessageAdded:", newMessage);
        setChatLog((prevChatLog) => [
          ...prevChatLog,
          { senderId: newMessage.senderId, message: newMessage.message },
        ]);
      });
    }
  }, [roomId, isViewLoaded]);

  //メッセージ受信時
  useEffect(() => {
    if (isViewLoaded) {
      setIsMyTurn((prevTurn) => !prevTurn);
      setRemainTurn((prevCount) => prevCount - 1);
    }
  }, [chatLog]);

  // バトル終了時
  useEffect(() => {
    if (remainTurn === 0) {
      // alert("Battle Ended!");
    }
  }, [remainTurn]);

  //resultに遷移
  const toResultSegue = (result: ResultData) => {
    navigate("/result", { state: { result } });
  };

  //#region ui
  const handleSendMessage = async () => {
    if (message.trim() && isMyTurn && roomId && remainTurn > 0) {
      setMessage("送信中...");
      await sendMessage(roomId, message);
      setMessage("");
    }
  };

  // 回答を送信
  const handleSubmit = async () => {
    if (answer.select === null || !answer.identity || !roomId || !myId) {
      console.error("Invalid answer data");
      return;
    }
    if (answer.message.trim() === "") {
      //TODO: メッセージが空の場合の処理
    }
    sendAnswer(roomId, answer);
    setIsSubmitted(true);

    //両回答が揃ったら結果を確認
    if (isHost) {
      checkAnswers(roomId);
    }
  };

  //リザルトを監視
  useEffect(() => {
    if (isSubmitted && roomId) {
      const unsubscribe = onResultUpdated(roomId, myNumber, (result) => {
        if (result) {
          console.log("Result updated:", result);
          // バトル終了時の処理
          toResultSegue(result);
        }
        console;
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isSubmitted]);

  const handleFinishMatching = () => {
    console.log("Finishing battle...");
    // バトル終了のロジック
  };

  //html
  return (
    <div>
      <h1>対戦画面</h1>
      <p>ルームID: {roomId}</p>
      <div>
        <h2>チャットログ</h2>
        <ul>
          {chatLog.map((msg, index) => (
            <li key={index}>
              <strong>{playerNames[msg.senderId] || "Unknown"}:</strong>{" "}
              {msg.message}
            </li>
          ))}
        </ul>
      </div>
      <p>残りメッセージ数: {remainTurn}</p>
      <p>このターンの残り時間: {remainingTime}秒</p>
      <p>ターンプレーヤー: {isMyTurn ? "あなた" : "相手"}</p>
      <p>相手: {opponentData.name}</p>
      <div>
        <label>
          メッセージ:
          <input
            type="text"
            placeholder="Enter message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <button
          onClick={handleSendMessage}
          disabled={remainTurn <= 0 || !isMyTurn}
        >
          {isMyTurn || message === "送信中..." ? "送信" : "Wait for your turn"}
        </button>
      </div>
      {remainTurn === 0 && (
        <div>
          <h2>バトル終了</h2>
          <label>
            チャット相手は？:
            <select
              onChange={(e) =>
                setAnswer((prevAnswer) => ({
                  ...prevAnswer,
                  select: e.target.value === "true",
                }))
              }
              value={answer.select !== null ? String(answer.select) : ""}
            >
              <option value="">選んでください</option>
              <option value="true">人間</option>
              <option value="false">AI</option>
            </select>
          </label>

          <p>
            理由:
            <input
              type="text"
              value={answer.message}
              onChange={(e) =>
                setAnswer((prevAnswer) => ({
                  ...prevAnswer,
                  message: e.target.value,
                }))
              }
              placeholder="メッセージを入力してください"
            />
          </p>
          <button onClick={handleSubmit} disabled={isSubmitted}>
            {isSubmitted ? "送信完了" : "送信"}
          </button>
        </div>
      )}
      <Link to="/result">
        // FIXME: navigate to result view
        <button onClick={handleFinishMatching}>バトル終了</button>
      </Link>
    </div>
  );

  //#endregion
};

export default BattleView;
