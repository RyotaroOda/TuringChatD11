export type RoomData = {
    roomId: string;
    status: "waiting" | "playing" | "finished";
    hostId: string;
    players: PlayerData[];
    battleConfig: BattleConfig;
    battleLog: BattleLog;
};
export type PlayerData = {
    id: string;
    name: string;
    isReady: boolean;
    rating: number;
};
export type BattleConfig = {
    maxTurn: number;
    battleType: "Single" | "Double" | "Short" | "Werewolf";
    oneTurnTime: number;
    topic: string;
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
    timeStamps: {
        start: number;
        end: number;
    };
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
    time: number;
};
export type MatchResult = {
    roomId: string;
    startBattle: Boolean;
    message?: string;
};
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
    bots: BotData;
    questionnaire: QuestionnaireData | null;
    age: number | null;
    gender: "male" | "female" | "other" | "no_answer";
    language: string;
    location: {
        country: string;
        city: string | null;
    };
    platform: "mobile" | "web" | "desktop";
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
export declare enum AIModel {
    "gpt-4" = "gpt-4",
    "gpt-4-turbo" = "gpt-4-turbo",
    "gpt-3.5-turbo" = "gpt-3.5-turbo"
}
export type QuestionnaireData = {
    questions: string[];
    answers: string[];
};
export type GPTMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};
