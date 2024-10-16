import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { BattleConfig, BattleLog, BattleType } from "../../shared/types";
import { db } from "../services/firebase"; // Firebase初期化関数とRealtime DBをインポート

console.log("Initializing ...");
// initFirebase();  // Firebaseの初期化
const app = express();

// バトル設定
const battleConfig: BattleConfig = {
  maxTurn: 6 * 2,
  battleType: BattleType.Single,
  oneTurnTime: 60,
};

// バトルルームの作成エンドポイント
app.post('/create-room', async (req: Request, res: Response) => {
  const roomId = uuidv4();
  const newBattleLog: BattleLog = {
    currentTurn: 0,
    messages: [],
    activePlayerId: null,
  };
  const battleRoom = {
    roomId,
    player1: req.body.player1,
    player2: req.body.player2,
    battleConfig,
    battleLog: newBattleLog,
  };

  try {
    // Firebase Realtime Databaseに保存
    await db.ref('rooms/' + roomId).set(battleRoom);
    res.status(201).send({ roomId });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).send({ error: "Failed to create room" });
  }
});

// メッセージ送信エンドポイント
app.post('/send-message', async (req: Request, res: Response) => {
  const { roomId, message, senderId } = req.body;
  const roomRef = db.ref('rooms/' + roomId + '/battleLog');

  try {
    const battleLogSnapshot = await roomRef.once('value');
    const battleLog = battleLogSnapshot.val();

    battleLog.messages.push({ senderId, message });
    battleLog.currentTurn += 1;

    await roomRef.update(battleLog);
    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send({ error: "Failed to send message" });
  }
});

// ポート番号の設定
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
