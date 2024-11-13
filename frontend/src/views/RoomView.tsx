// frontend/src/views/RoomView.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RoomData, BotData, PlayerData } from "shared/dist/types";
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
  const location = useLocation();
  const { roomData, botData } = location.state as {
    roomData: RoomData;
    botData: BotData;
  };
  const roomId = roomData.roomId;
  const myId = auth.currentUser?.uid;

  const myKey =
    Object.keys(roomData.players).find(
      (key) => roomData.players[key].id === myId
    ) ?? "";

  const [players, setPlayers] = useState(Object.values(roomData.players));
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<"human" | "ai">("human");
  const [selectedBotId, setSelectedBotId] = useState<number>(botData.defaultId);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(120); // Example: 2 minutes for preparation

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    if (timeLeft === 0) {
      handleForceReady();
    }

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Handle player readiness
  const handleReadyClick = () => {
    if (selectedMode === "ai" && selectedBotId === null) {
      alert("Please select an AI bot.");
      return;
    }
    setIsReady(true);
    preparationComplete(roomId, myKey);
  };

  // Handle force ready when time is up
  const handleForceReady = () => {
    if (!isReady) {
      // Auto-select default settings if not selected
      if (
        selectedMode === "ai" &&
        selectedBotId === null &&
        botData.data.length > 0
      ) {
        setSelectedBotId(botData.defaultId);
      }
      setIsReady(true);
      preparationComplete(roomId, myKey);
    }
  };

  useEffect(() => {
    if (isReady) {
      const unsubscribe = onPlayerPrepared(roomId, (result) => {
        if (result) {
          console.log("preparations updated:", result);
          setPlayers(Object.values(result));
          // if (
          //   Array.isArray(result) &&
          //   result.every((player) => player.isReady)
          // ) {
          //   toBattleViewSegue();
          // }
        }
      });
    }
  }, [isReady]);

  // Navigate to BattleView when all players are ready
  useEffect(() => {
    console.log("Players updated:", players);
    if (players.every((player) => player.isReady)) {
      toBattleViewSegue();
    }
  }, [players]);

  const toBattleViewSegue = () => {
    const props: BattleViewProps = {
      roomId: roomData.roomId,
      roomData: roomData,
      isHuman: selectedMode === "human",
      bot:
        selectedMode === "ai" && selectedBotId
          ? (botData.data.find((bot) => bot.id === selectedBotId) ?? null)
          : null,
    };
    navigate(`/${roomData.roomId}/battle`, { state: props });
  };

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
              checked={selectedMode === "human"}
              onChange={() => setSelectedMode("human")}
            />
            自分でプレイする
          </label>
          <br />
          <label>
            <input
              type="radio"
              value="ai"
              checked={selectedMode === "ai"}
              onChange={() => setSelectedMode("ai")}
            />
            AIがプレイする
          </label>
        </div>
        {selectedMode === "ai" && (
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
        {/* <p>Battle Type: {roomData.battleConfig.battleType}</p> */}
        {/* <p>Topic: {roomData.battleConfig.topic}</p> */}
        <p>
          ターン数: {roomData.battleConfig.maxTurn}ターン ×{" "}
          {roomData.battleConfig.oneTurnTime} 秒
        </p>
        {/* <p>ターン時間: {roomData.battleConfig.oneTurnTime} 秒</p> */}
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
