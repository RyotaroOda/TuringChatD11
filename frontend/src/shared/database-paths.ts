//database-paths.ts

// Firebase Databaseの共通パスを管理
export const DATABASE_PATHS = {
  route_rooms: "rooms",

  room: (roomId: string) => `rooms/${roomId}`,
  players: (roomId: string) => `rooms/${roomId}/players`,
  ready: (roomId: string, playerId: string) =>
    `rooms/${roomId}/players/${playerId}`,
  status: (roomId: string) => `rooms/${roomId}/status`,
  battleLog: (roomId: string) => `rooms/${roomId}/battleLog`,
  messages: (roomId: string) => `rooms/${roomId}/battleLog/messages`,
  phase: (roomId: string) => `rooms/${roomId}/battleLog/phase`,
  startBattle: (roomId: string) => `rooms/${roomId}/battleLog/timestamps/start`,
  endBattle: (roomId: string) => `rooms/${roomId}/battleLog/timestamps/end`,
  submittedAnswers: (roomId: string) =>
    `rooms/${roomId}/battleLog/submitAnswer`,
  result: (roomId: string) => `rooms/${roomId}/battleLog/battleResult`,
  waitingPlayers: `randomMatching/waitingPlayers`,

  //firestore
  route_profiles: "profiles",
  profiles: (userId: string) => `profiles/${userId}`,
  bots: (userId: string) => `profiles/${userId}/bots`,
  questionnaires: (userId: string) => `profiles/${userId}/questionnaire`,
  impression: (userId: string) => `profiles/${userId}/impressions`,
};
