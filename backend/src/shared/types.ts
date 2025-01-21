//share/types.ts

import { Timestamp } from "firebase/firestore";

//#region RoomData
export type RoomData = {
  roomId: string;
  status: "waiting" | "matched" | "playing" | "finished";
  hostId: string;
  players: PlayerData[];
  battleData: BattleRoomData[];
};

export type PlayerData = {
  id: string;
  name: string;
  iconURL: string;
  isReady: boolean;
  rating: number;
};

//バトル設定
//バトルルームにつき1つのバトルデータがある
export type BattleRoomData = {
  battleId: string;
  status: "waiting" | "matched" | "started" | "answer" | "finished";
  hostId: string;
  players: PlayerData[];
  battleRule: BattleRules;
  chatData: ChatData;
  submitAnswer: SubmitAnswer[];
  battleResult: BattleResult[];
  timestamps: { start: Date; end: Date };
};

//バトルルール
export type BattleRules = {
  maxTurn: number;
  battleType: "Single" | "Double" | "Short" | "Werewolf";
  oneTurnTime: number;
};

//メッセージ
export type Message = {
  senderId: string;
  message: string;
  timestamp: Timestamp;
};

//バトルログ バトル中に参照する用
export type ChatData = {
  currentTurn: number;
  activePlayerId: string;
  messages: Message[];
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
  battleId: string;
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

  signUpDate: string;
  lastLoginDate: string;
  lastGeneratedImageDate: string;

  rating: number;
  win: number;
  lose: number;
  draw: number;

  bots: BotData;

  questionnaire: QuestionnaireData | null;

  age: number | null; // 年齢（オプション）
  gender: "male" | "female" | "other" | "no_answer"; // 性別（選択式）

  // プラットフォームメタデータ
  language: string; // 言語（例: "en", "ja"）
  location: {
    country: string; // 国
    region: string | null; // 地域（オプション）
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
  q1: string; // 1. 名前（自由記述）
  q2: string; // 2. 年齢（数字入力）
  q3: string; // 3. 学部・学科
  q4: string; // 4. 生成AI経験
  q5: string; // 5. 操作方法の分かりやすさ
  q6: string; // 6. インターフェースの使いやすさ
  q7: string; // 7. チュートリアルの内容
  q8: string; // 8. 生成AIの基本的操作方法理解
  q9: string; // 9. 生成AIの基本的仕組み理解
  q10: string; // 10. 生成AI成果物の特徴理解
  q11: string; // 11. 目的に応じた生成AIのカスタマイズ理解
  q12: string; // 12. 生成AI利用のリスク・倫理的課題理解
  q13: string; // 13. ゲーム要素は学習意欲を高めるか
  q14: string; // 14. 主体的に学習や操作に取り組めたか
  q15: string; // 15. ツールを使用しない場合と比べて成績・理解度向上か
  q16: string; // 16. 今後もAI活用ツールを使って学びたいか
  q17: string; // 17. ツール全体の満足度
  q18: string; // 18. 他の教科・学習活動にも活用できると思うか
  q19: string; // 19. 自由記述欄
  timestamp: Timestamp;
};

//感想
export type Impression = {
  impression: string;
  date: Timestamp;
  user: string;
  userId: string;
};

//#endregion

// GPT
export type GPTMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type JudgementResponse = {
  correct: boolean;
  reason: string;
};
