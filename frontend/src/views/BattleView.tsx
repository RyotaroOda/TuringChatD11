//frontend/src/views/BattleView.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  ResultData,
} from "../shared/types";
import { auth } from "../services/firebase_f.ts";
import { BotSetting, GPTMessage } from "../shared/types.ts";
import { ResultViewProps } from "./ResultView.tsx";
import { generateBattleMessage } from "../services/chatGPT_f.ts";

export interface BattleViewProps {
  roomId: string;
  roomData: RoomData;
  isHuman: boolean;
  bot: BotSetting | null;
}

const BattleView: React.FC = () => {
  //#region init
  const [isViewLoaded, setIsLoaded] = useState<boolean>(false);
  const location = useLocation();
  const { roomId, roomData, isHuman, bot } = location.state as BattleViewProps;
  const user = auth.currentUser;
  const myId = user?.uid || "error";

  const playersKey = Object.keys(roomData.players);
  const isHost = myId === roomData.hostId;
  const myData: PlayerData = isHost
    ? roomData.players[playersKey[0]]
    : roomData.players[playersKey[1]];
  const opponentData: PlayerData = isHost
    ? roomData.players[playersKey[1]]
    : roomData.players[playersKey[0]];

  const myName = `${myData.name} (あなた)` || "error";
  const battleConfig = roomData.battleConfig;
  const playerNames: Record<string, string> = {
    [myId]: myName,
    [opponentData.id]: opponentData.name,
  };

  const navigate = useNavigate();
  const [chatLog, setChatLog] = useState<
    { senderId: string; message: string }[]
  >([]);
  const [message, setMessage] = useState<string>("");
  const [promptMessages, setPromptMessages] = useState<GPTMessage[]>([]);
  const [promptInstruction, setPromptInstruction] = useState<string>("");
  const [isMyTurn, setIsMyTurn] = useState<boolean>(isHost);
  const [remainTurn, setRemainTurn] = useState<number>(
    roomData.battleConfig.maxTurn
  );
  const [timeLeft, setTimeLeft] = useState<number>(battleConfig.oneTurnTime);
  const [isWaitResponse, setIsWaitResponse] = useState<boolean>(false);
  const [answer, setAnswer] = useState<SubmitAnswer>({
    playerId: myId,
    isHuman: isHuman,
    select: null,
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    setIsLoaded(true);
  }, [battleConfig]);
  //#endregion

  //#region メッセージ
  // メッセージを送信する
  const handleSendMessage = async () => {
    if (message.trim() && isMyTurn && roomId && remainTurn > 0) {
      setMessage("送信中...");
      await sendMessage(roomId, message);
      setMessage("");
    }
  };

  // ボットによるメッセージ生成
  const generateMessage = async () => {
    setIsWaitResponse(true);
    if (bot) {
      const generatedMessage = await generateBattleMessage(
        promptMessages,
        "メッセージ生成",
        bot,
        battleConfig
      );
      setMessage(generatedMessage);
    } else {
      console.error("Bot setting is null");
    }
    setIsWaitResponse(false);
  };

  // メッセージ更新リスナー
  useEffect(() => {
    if (roomId && isViewLoaded) {
      onMessageAdded(roomId, (newMessage) => {
        console.log("onMessageAdded:", newMessage);
        setChatLog((prevChatLog) => [
          ...prevChatLog,
          { senderId: newMessage.senderId, message: newMessage.message },
        ]);
        if (!isHuman) {
          const id =
            newMessage.senderId === myId ? "[opponent]" : "[proponent]";
          setPromptMessages((prevMessages) => [
            ...prevMessages,
            { role: "user", content: id + newMessage.message },
          ]);
        }
      });
    }
  }, [roomId, isViewLoaded]);

  // ターンの切り替え
  useEffect(() => {
    if (isViewLoaded) {
      setIsMyTurn((prevTurn) => !prevTurn);
      setRemainTurn((prevCount) => prevCount - 1);
    }
  }, [chatLog]);
  //#endregion

  //#region バトル終了時の処理
  // 残りターンが0の場合
  useEffect(() => {
    if (remainTurn === 0) {
      console.log("Battle Ended");
    }
  }, [remainTurn]);

  // 回答を送信する
  const handleSubmit = async () => {
    if (answer.select === null || !roomId || !myId) {
      console.error("Invalid answer data");
      return;
    }
    if (answer.message.trim() === "") {
      console.warn("メッセージが空です");
      return;
    }
    sendAnswer(roomId, answer);
    setIsSubmitted(true);

    if (isHost) {
      checkAnswers(roomId);
    }
  };

  // タイマーの処理
  useEffect(() => {
    if (remainTurn <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    if (timeLeft === 0 && isMyTurn) {
      handleSendMessage();
    }

    return () => clearInterval(timer);
  }, [timeLeft, isMyTurn]);

  // ターンが切り替わる際にタイマーをリセット
  useEffect(() => {
    if (isMyTurn) {
      setTimeLeft(battleConfig.oneTurnTime);
    }
  }, [isMyTurn]);

  // リザルトを監視する
  useEffect(() => {
    if (isSubmitted && roomId) {
      const unsubscribe = onResultUpdated(roomId, isHost, (result) => {
        if (result) {
          console.log("Result updated:", result);
          toResultSegue(result);
        }
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isSubmitted]);

  // 結果画面への遷移
  const toResultSegue = (result: ResultData) => {
    const props: ResultViewProps = {
      resultData: result,
    };
    console.log("ResultView props:", props);
    navigate(`/${roomId}/battle/result`, { state: props });
  };
  //#endregion

  return (
    <div>
      <h1>対戦画面</h1>
      <p>ルームID: {roomId}</p>
      <div>
        <h2>{battleConfig.topic}</h2>
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
      {remainTurn > 0 ? (
        <div>
          <p>ターンプレーヤー: {isMyTurn ? "あなた" : "相手"}</p>
          <p>このターンの残り時間: {timeLeft}秒</p>
          <p>残りメッセージ数: {remainTurn}</p>
        </div>
      ) : (
        "バトル終了"
      )}
      <p>相手: {opponentData.name}</p>
      <div>
        <label>メッセージ:</label>
        {isHuman ? (
          <input
            type="text"
            placeholder="Enter message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        ) : (
          <p>
            {message}
            <br />
            <label>命令</label>
            <input
              type="text"
              placeholder="命令なし"
              value={promptInstruction}
              onChange={(e) => setPromptInstruction(e.target.value)}
            />
            <button onClick={generateMessage} disabled={isWaitResponse}>
              {isWaitResponse ? "生成中" : "メッセージ生成"}
            </button>
          </p>
        )}
        <button
          onClick={handleSendMessage}
          disabled={remainTurn <= 0 || !isMyTurn || message === "送信中..."}
        >
          {isMyTurn ? "送信" : "Wait for your turn"}
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
    </div>
  );
};

export default BattleView;
