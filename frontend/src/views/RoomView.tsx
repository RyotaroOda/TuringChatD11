//frontend/src/views/RoomView.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RoomData, BotData, PlayerData } from "../shared/types.ts";
import { BattleViewProps } from "./BattleView.tsx";
import {
  onPlayerPrepared,
  preparationComplete,
} from "../services/firebase-realtime-database.ts";
import { auth } from "../services/firebase_f.ts";

export interface OnlineRoomViewProps {
  roomData: RoomData;
  botData: BotData;
}

const RoomView: React.FC = () => {
  //#region init
  const location = useLocation();
  const { roomData, botData } = location.state as OnlineRoomViewProps;
  const roomId = roomData.roomId;
  const myId = auth.currentUser?.uid;

  const myKey =
    Object.keys(roomData.players).find(
      (key) => roomData.players[key].id === myId
    ) ?? "";

  const [players, setPlayers] = useState<PlayerData[]>(
    Object.values(roomData.players)
  );
  const navigate = useNavigate();
  const [selectedIsHuman, setSelectedIsHuman] = useState<boolean>(true);
  const [selectedBotId, setSelectedBotId] = useState<number>(botData.defaultId);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(120); // Example: 2 minutes for preparation
  //#endregion

  // タイマー処理
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    if (timeLeft === 0) {
      handleForceReady();
    }

    return () => clearInterval(timer);
  }, [timeLeft]);

  //#region プレイヤー準備
  // プレイヤーの準備をクリック
  const handleReadyClick = () => {
    if (selectedIsHuman === false && selectedBotId === null) {
      alert("Please select an AI bot.");
      return;
    }
    setIsReady(true);
    preparationComplete(roomId, myKey);
  };

  // 準備時間が切れた際に自動的に準備完了にする
  const handleForceReady = () => {
    if (!isReady) {
      if (
        selectedIsHuman === false &&
        selectedBotId === null &&
        botData.data.length > 0
      ) {
        setSelectedBotId(botData.defaultId);
      }
      setIsReady(true);
      preparationComplete(roomId, myKey);
    }
  };

  // 他プレイヤーの準備完了を監視
  useEffect(() => {
    const unsubscribe = onPlayerPrepared(roomId, (result) => {
      if (result) {
        console.log("preparations updated:", result);
        setPlayers(Object.values(result));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  // すべてのプレイヤーが準備完了になったらバトルビューに遷移
  useEffect(() => {
    if (players.every((player) => player.isReady)) {
      toBattleViewSegue();
    }
  }, [players]);
  //#endregion

  //#region バトル画面遷移
  // バトル画面に遷移する関数
  const toBattleViewSegue = () => {
    const props: BattleViewProps = {
      roomId: roomData.roomId,
      roomData: roomData,
      isHuman: selectedIsHuman,
      bot:
        selectedIsHuman === false && selectedBotId
          ? (botData.data.find((bot) => bot.id === selectedBotId) ?? null)
          : null,
    };
    navigate(`/${roomData.roomId}/battle`, { state: props });
  };
  //#endregion

  return (
    <div className="online-room-view">
      <h2>Room ID: {roomData.roomId}</h2>

      <div className="battle-preparation">
        <h3>バトル準備</h3>
        <p>残り時間: {timeLeft} 秒</p>
        <div className="participation-mode">
          <label>
            <input
              type="radio"
              value="human"
              checked={selectedIsHuman}
              onChange={() => setSelectedIsHuman(true)}
            />
            自分でプレイする
          </label>
          <br />
          <label>
            <input
              type="radio"
              value="ai"
              checked={selectedIsHuman === false}
              onChange={() => setSelectedIsHuman(false)}
            />
            AIがプレイする
          </label>
        </div>
        {selectedIsHuman === false && (
          <div className="bot-selection">
            <label>使用するAI:</label>
            <select
              value={selectedBotId ?? ""}
              onChange={(e) => setSelectedBotId(Number(e.target.value))}
            >
              <option value="" disabled>
                選んでください
              </option>
              {botData.data.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name} ({bot.model})
                </option>
              ))}
            </select>
          </div>
        )}
        <button onClick={handleReadyClick} disabled={isReady}>
          {isReady ? "待機中..." : "準備完了"}
        </button>
      </div>

      <div className="battle-config">
        <h3>バトル設定</h3>
        <p>
          ターン数: {roomData.battleConfig.maxTurn}ターン ×{" "}
          {roomData.battleConfig.oneTurnTime} 秒
        </p>
      </div>

      <div className="players-status">
        <h3>プレイヤー一覧</h3>
        <ul>
          {players.map((player) => (
            <li key={player.id}>
              {player.name} - {player.isReady ? "準備完了！" : "準備中..."}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RoomView;
