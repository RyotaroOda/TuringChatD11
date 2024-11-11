//types.ts

//バトル設定
export type BattleConfig = {
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

//バトルログ
export type BattleLog = {
  phase: "waiting" | "chat" | "answer" | "finished";
  currentTurn: number; //未使用
  messages: Message[];
  activePlayerId: string; //未使用
  submitAnswer: SubmitAnswer[];
  battleResult: BattleResult[];
  timeStamps: { start: number; end: number };
};

export enum AIModel {
  "gpt-4" = "gpt-4",
  "gpt-4-turbo" = "gpt-4-turbo",
  "gpt-3.5-turbo" = "gpt-3.5-turbo",
}

export type BotSetting = {
  id: number;
  name: string;
  prompt: string;
  model: AIModel;
  temperature: number;
  top_p: number;
};

export type BotData = {
  defaultId: number;
  data: BotSetting[];
};

export type PlayerData = {
  id: string;
  name: string;
  rating: number;
};

export type RoomData = {
  roomId: string;
  status: "waiting" | "playing" | "finished";
  players: PlayerData[];
  battleConfig: BattleConfig;
  battleLog: BattleLog;
};

//firebase functions
export type MatchResult = {
  roomId: string;
  startBattle: Boolean;
  message?: string;
};

//プレイヤーの回答
export type SubmitAnswer = {
  playerId: string;
  identity: Boolean; //isHuman?
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

//各クライアント用
export type ResultData = {
  playerId: string;
  myAnswer: SubmitAnswer;
  opponentAnswer: SubmitAnswer;
  corrects: Boolean[];
  win: "win" | "lose" | "draw";
  score: number;
  time: number;
};

export type ProfileData = {
  userId: string;
  name: string;

  signUpDate: number;
  lastLoginDate: number;

  rating: number;
  win: number;
  lose: number;

  bots: BotData | null;

  questionnaire: QuestionnaireData | null;

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

export type QuestionnaireData = {
  questions: string[];
  answers: string[];
};

// GPT
export type GPTMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
