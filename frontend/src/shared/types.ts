//share/types.ts

import { BattleRoomIds } from "./database-paths";

//#region RoomData
export type RoomData = {
  roomId: string;
  status: "waiting" | "matched" | "playing" | "finished";
  hostId: string;
  players: PlayerData[];
  battleData: BattleData[];
};

export type PlayerData = {
  id: string;
  name: string;
  isReady: boolean;
  rating: number;
};

//バトル設定
export type BattleData = {
  ids: BattleRoomIds;
  status: "waiting" | "matched" | "playing" | "finished";
  phase: "waiting" | "chat" | "answer" | "result" | "finished";
  hostId: string;
  players: PlayerData[];
  battleRules: BattleRules;
  battleLog: BattleLog;
  winnerId: string | null;
};

//バトルルール
export type BattleRules = {
  maxTurn: number;
  battleType: "Single" | "Double" | "Short" | "Werewolf";
  oneTurnTime: number;
  topic: string;
};

//メッセージ
export type Message = {
  senderId: string;
  message: string;
  timestamp: number;
};

//バトルログ バトル中に参照する用
export type BattleLog = {
  phase: "waiting" | "chat" | "answer" | "finished";
  currentTurn: number; //未使用
  messages: Message[];
  activePlayerId: string; //未使用
  submitAnswer: SubmitAnswer[];
  battleResult: BattleResult[];
  timeStamps: { start: number; end: number };
};

//プレイヤーの回答
export type SubmitAnswer = {
  playerId: string;
  isHuman: Boolean; //isHuman?
  select: Boolean | null;
  message: string;
};

//データベース用
export type BattleResult = {
  corrects: Boolean[];
  scores: number[];
  answers: SubmitAnswer[];
  time: number;
};

//#endregion

//#region firebase functions
//マッチンング後クライアントに返すデータ
export type MatchResult = {
  ids: BattleRoomIds;
  startBattle: Boolean;
  message?: string;
};

//リザルト計算後クライアントに返すデータ
export type ResultData = {
  playerId: string;
  myAnswer: SubmitAnswer;
  opponentAnswer: SubmitAnswer;
  myCorrects: Boolean;
  opponentCorrects: Boolean;
  win: "win" | "lose" | "draw";
  score: number;
  time: number;
};
//#endregion

//#region ProfileData
export type ProfileData = {
  userId: string;
  name: string;

  signUpDate: number;
  lastLoginDate: number;

  rating: number;
  win: number;
  lose: number;

  bots: BotData;

  questionnaire: QuestionnaireData | null;
  impressions: Impression[];

  age: number | null; // 年齢（オプション）
  gender: "male" | "female" | "other" | "no_answer"; // 性別（選択式）

  // プラットフォームメタデータ
  language: string; // 言語（例: "en", "ja"）
  location: {
    country: string; // 国
    city: string | null; // 都市（オプション）
  };

  platform: "mobile" | "web" | "desktop"; // 利用プラットフォーム
};

export type BotData = {
  defaultId: number;
  data: BotSetting[];
};

export type BotSetting = {
  id: number;
  name: string;
  prompt: string;
  model: AIModel;
  temperature: number;
  top_p: number;
};

export enum AIModel {
  "gpt-4o" = "gpt-4o",
  "gpt-4o-mini" = "gpt-4o-mini",
  "gpt-4" = "gpt-4",
  "gpt-4-turbo" = "gpt-4-turbo",
  "gpt-3.5-turbo" = "gpt-3.5-turbo",
}

//実験アンケート
export type QuestionnaireData = {
  questions: string[];
  answers: string[];
};

//感想
export type Impression = {
  impression: string;
  date: Date;
};

//#endregion

// GPT
export type GPTMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
