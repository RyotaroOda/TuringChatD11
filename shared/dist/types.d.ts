export type BattleConfig = {
    maxTurn: number;
    battleType: BattleType;
    oneTurnTime: number;
};
export declare enum BattleType {
    Single = 0,
    Multi = 1
}
export type Message = {
    senderId: string;
    message: string;
};
export type BattleLog = {
    currentTurn: number;
    messages: Message[];
    activePlayerId: string | null;
};
export declare const newBattleLog: BattleLog;
export declare enum AIModel {
    GPT3 = 0,
    GPT2 = 1,
    default = 2
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
    player1: PlayerData;
    player2?: PlayerData;
    battleConfig: BattleConfig;
    battleLog: BattleLog;
};
export type MatchResult = {
    roomId: string;
    startBattle: Boolean;
    message?: string;
};
