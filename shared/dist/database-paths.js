"use strict";
//database-paths.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATABASE_PATHS = void 0;
// Firebase Databaseの共通パスを管理
exports.DATABASE_PATHS = {
    route_rooms: "rooms",
    room: (roomId) => `rooms/${roomId}`,
    players: (roomId) => `rooms/${roomId}/players`,
    ready: (roomId, playerId) => `rooms/${roomId}/players/${playerId}`,
    status: (roomId) => `rooms/${roomId}/status`,
    battleLog: (roomId) => `rooms/${roomId}/battleLog`,
    messages: (roomId) => `rooms/${roomId}/battleLog/messages`,
    phase: (roomId) => `rooms/${roomId}/battleLog/phase`,
    startBattle: (roomId) => `rooms/${roomId}/battleLog/timestamps/start`,
    endBattle: (roomId) => `rooms/${roomId}/battleLog/timestamps/end`,
    submittedAnswers: (roomId) => `rooms/${roomId}/battleLog/submitAnswer`,
    result: (roomId) => `rooms/${roomId}/battleLog/battleResult`,
    waitingPlayers: `randomMatching/waitingPlayers`,
    //firestore
    route_profiles: "profiles",
    profiles: (userId) => `profiles/${userId}`,
    bots: (userId) => `profiles/${userId}/bots`,
    questionnaires: (userId) => `profiles/${userId}/questionnaire`,
    impression: (userId) => `profiles/${userId}/impressions`,
};
