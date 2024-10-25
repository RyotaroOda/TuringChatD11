//バトル設定
export type BattleConfig = {
  maxTurn: number;
  battleType: BattleType;
  oneTurnTime: number;
};

export enum BattleType {
  Single,
  Double,
  Short,
  Werewolf,
}

//メッセージ
export type Message = {
  senderId: string;
  message: string;
  timestamp: number;
};

//バトルログ
export type BattleLog = {
  currentTurn: number;
  messages: Message[]; //
  activePlayerId: string | null;
};

export const newBattleLog: BattleLog = {
  currentTurn: 0,
  messages: [],
  activePlayerId: null,
};

export enum AIModel {
  GPT3,
  GPT2,
  default,
}

export type botData = {
  prompt: string;
  model: AIModel;
};

export type PlayerData = {
  id: string;
  name: string;
  rating: number;
  bot: botData;
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
