import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  sendMessage,
  onMessageAdded,
  onBattleEnd,
} from "../services/firebase-realtime-database.ts";
import { BattleLog, PlayerData, RoomData } from "shared/dist/types";
import { useAuth } from "../services/useAuth.tsx";

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
  const [remainingTime, setRemainingTime] = useState<number>(
    battleConfig.oneTurnTime
  );
  //#endregion

  useEffect(() => {
    console.log("battle view load complete", isHost);
    setIsLoaded(true);
  }, [battleConfig]);

  // Player names mapping
  const playerNames: Record<string, string> = {
    [myId]: myName,
    [opponentData.id]: opponentData.name,
  };
  const [chatLog, setChatLog] = useState<
    { senderId: string; message: string }[]
  >([]);
  const [message, setMessage] = useState<string>("");
  const [isMyTurn, setIsMyTurn] = useState<boolean>(isHost); // Initial turn state (placeholder)
  const [turnCount, setTurnCount] = useState<number>(0);

  // ゲームの進行状況を監視する
  useEffect(() => {
    if (roomId && isViewLoaded) {
      // ターン更新をFirebaseから受け取る
      onMessageAdded(roomId, (newMessage) => {
        console.log("onMessageAdded:", newMessage);
        // setIsMyTurn(!isMyTurn);
        // setIsMyTurn((prevTurn) => !prevTurn);

        // setTurnCount(turnCount + 1);

        setChatLog((prevChatLog) => [
          ...prevChatLog,
          { senderId: newMessage.senderId, message: newMessage.message },
        ]);
      });
    }
  }, [roomId, isViewLoaded]);

  useEffect(() => {
    if (isViewLoaded) {
      setIsMyTurn((prevTurn) => !prevTurn);
      setTurnCount((prevCount) => prevCount + 1);
    }
  }, [chatLog]);

  // バトル終了の監視
  useEffect(() => {
    if (roomId) {
      onBattleEnd(roomId, () => {
        alert("Battle Ended!");
      });
    }
  }, [roomId]);

  const handleSendMessage = async () => {
    if (message.trim() && isMyTurn && roomId) {
      setMessage("送信中...");
      await sendMessage(roomId, message);
      setMessage("");
    }
  };

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
      <p>残りメッセージ数: {battleConfig.maxTurn - turnCount}</p>
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
        <button onClick={handleSendMessage} disabled={!isMyTurn}>
          {isMyTurn || message === "送信中..." ? "送信" : "Wait for your turn"}
        </button>
      </div>
      <Link to="/result">
        <button onClick={handleFinishMatching}>バトル終了</button>
      </Link>
    </div>
  );
};

export default BattleView;
