export type BattleConfig = {
    maxTurn: number;
    battleType: "Single" | "Double" | "Short" | "Werewolf";
    oneTurnTime: number;
};
export type Message = {
    senderId: string;
    message: string;
    timestamp: number;
};
export type BattleLog = {
    phase: "waiting" | "chat" | "answer" | "finished";
    currentTurn: number;
    messages: Message[];
    activePlayerId: string;
    submitAnswer: SubmitAnswer[];
    battleResult: BattleResult[];
};
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
    status: "waiting" | "playing" | "finished";
    players: PlayerData[];
    battleConfig: BattleConfig;
    battleLog: BattleLog;
};
export type MatchResult = {
    roomId: string;
    startBattle: Boolean;
    message?: string;
};
export type SubmitAnswer = {
    playerId: string;
    identity: Boolean;
    select: Boolean | null;
    message: string;
};
export type BattleResult = {
    corrects: Boolean[];
    scores: number[];
    answers: SubmitAnswer[];
};
export type ResultData = {
    playerId: string;
    myAnswer: SubmitAnswer;
    opponentAnswer: SubmitAnswer;
    corrects: Boolean[];
    win: "win" | "lose" | "draw";
    score: number;
};
