import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  sendMessage,
  onTurnUpdated,
  onBattleEnd,
} from "../services/firebase-realtime-database.ts";
import { BattleLog, PlayerData, RoomData } from "shared/dist/types";
import { useAuth } from "../services/useAuth.tsx";

const BattleView: React.FC = () => {
  //#region init
  const { roomId } = useParams<{ roomId: string }>();

  const { user } = useAuth();
  const myId = user?.uid || "error";

  // Location and Params
  const location = useLocation();
  const state: RoomData = location.state.roomData;

  const myData: PlayerData =
    myId === state.player1.id ? state.player1 : state.player2!;
  const opponentData: PlayerData =
    myId === state.player1.id ? state.player2! : state.player1;

  // Player Information
  const myName = `${myData.name} (あなた)` || "error";

  // Battle Configuration
  const battleConfig = state.battleConfig;
  const [remainingTime, setRemainingTime] = useState<number>(
    battleConfig.oneTurnTime
  );
  //#endregion
  console.log("data", state);

  // Player names mapping
  const playerNames: Record<string, string> = {
    [myId]: myName,
    [opponentData.id]: opponentData.name,
  };
  const [chatLog, setChatLog] = useState<
    { senderId: string; message: string }[]
  >([]);
  const [message, setMessage] = useState<string>("");
  const [isMyTurn, setIsMyTurn] = useState<boolean>(true); // Initial turn state (placeholder)
  const [turnCount, setTurnCount] = useState<number>(0);

  // ゲームの進行状況を監視する
  useEffect(() => {
    if (roomId) {
      // ターンの更新を監視
      // onTurnUpdated(roomId, (data: { battleLog: BattleLog }) => {
      //   setIsMyTurn(data.battleLog.activePlayerId === myId); // 自分のターンかどうかを判定
      //   setTurnCount(data.battleLog.currentTurn);
      //   // 新しいメッセージが追加されていれば、それをチャットログに追加
      //   const newMessage = data.battleLog.messages[data.battleLog.currentTurn];
      //   if (newMessage) {
      //     setChatLog((prevChatLog) => [
      //       ...prevChatLog,
      //       { senderId: newMessage.senderId, message: newMessage.message },
      //     ]);
      //   }
      // });
    }
  }, [roomId, myId]);

  // useEffect(() => {
  //   if (roomId) {
  //     // ターン更新をFirebaseから受け取る
  //     onTurnUpdated(roomId, (data: { battleLog: BattleLog }) => {
  //       setIsMyTurn(data.battleLog.activePlayerId === myId);
  //       setTurnCount(data.battleLog.currentTurn);

  //       const newMessage = data.battleLog.messages[data.battleLog.currentTurn];
  //       setChatLog((prevChatLog) => [
  //         ...prevChatLog,
  //         { senderId: newMessage.senderId, message: newMessage.message },
  //       ]);
  //       if (message === "送信中...") setMessage("");
  //     });
  //   }
  // }, [roomId, myId, message]);

  // // バトル終了の監視
  // useEffect(() => {
  //   if (roomId) {
  //     onBattleEnd(roomId, () => {
  //       alert("Battle Ended!");
  //     });
  //   }
  // }, [roomId]);

  const handleSendMessage = async () => {
    if (message.trim() && isMyTurn && roomId) {
      await sendMessage(roomId, message);
      setMessage("送信中...");
      setIsMyTurn(false);
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
          {isMyTurn ? "送信" : "Wait for your turn"}
        </button>
      </div>
      <Link to="/result">
        <button onClick={handleFinishMatching}>バトル終了</button>
      </Link>
    </div>
  );
};

export default BattleView;
