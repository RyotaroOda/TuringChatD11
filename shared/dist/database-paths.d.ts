export declare const DATABASE_PATHS: {
    route_rooms: string;
    room: (roomId: string) => string;
    players: (roomId: string) => string;
    status: (roomId: string) => string;
    battleLog: (roomId: string) => string;
    messages: (roomId: string) => string;
    phase: (roomId: string) => string;
    startBattle: (roomId: string) => string;
    endBattle: (roomId: string) => string;
    submittedAnswers: (roomId: string) => string;
    result: (roomId: string) => string;
    waitingPlayers: string;
    route_profiles: string;
    profiles: (userId: string) => string;
};