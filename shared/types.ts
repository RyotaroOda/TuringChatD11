export enum BattleType {
  Single,
  Party,
}

//バトル設定
export type BattleConfig = {
  maxTurn: number;
  battleType: BattleType;
  oneTurnTime: number;
};

//メッセージ
export type Message = {
  senderId: string;
  message: string;
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

//ルーム情報
export type Room = {
  roomId: string;
  player1: string;
  player2: string;
  battleConfig: BattleConfig;
  battleLog: BattleLog;
};

export type Player = {
  id: string;
  rating: number; // プレイヤーのレーティング（スキル値）
  timeWaiting: number; // 待機時間
};

export type MatchResult = {
  roomId: string;
  opponentId: string;
  message?: string; // Optional property
};
