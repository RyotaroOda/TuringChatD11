//database-paths.ts
// Firebase Databaseの共通パスを管理
export const DATABASE_PATHS = {
  //realtime database
  //root
  route_rooms: "rooms",
  route_battles: "battles",
  route_private: "private",

  waitingPlayers: `waitingPlayers/randomMatching`,
  room: (roomId: string) => `rooms/${roomId}`,
  battle: (battleId: string) => `battles/${battleId}/public`,
  // private: (playerId: string) => `private/${playerId}`,

  //room
  players: (roomId: string) => `rooms/${roomId}/players`,

  //battle
  battleRoom: (battleId: string) => `battles/${battleId}/public`,
  battlePrivate: (battleId: string, playerId: string) =>
    `battles/${battleId}/private/${playerId}`,
  status: (battleId: string) => `battles/${battleId}/public/status`,
  battlePlayers: (battleId: string) => `battles/${battleId}/public/players`,
  ready: (battleId: string, playerId: string) =>
    `battles/${battleId}/public/players/${playerId}`,
  rules: (battleId: string) => `battles/${battleId}/public/battleRules`,
  topic: (battleId: string) => `battles/${battleId}/public/battleRules/topic`,

  //battle/battleLog
  messages: (battleId: string) =>
    `battles/${battleId}/public/battleLog/messages`,
  phase: (battleId: string) => `battles/${battleId}/public/battleLog/phase`,
  startBattle: (battleId: string) =>
    `battles/${battleId}/public/battleLog/timestamps/start`,
  endBattle: (battleId: string) =>
    `battles/${battleId}/public/battleLog/timestamps/end`,
  submittedAnswers: (battleId: string) =>
    `battles/${battleId}/public//battleLog/submitAnswer`,
  result: (battleId: string) =>
    `battles/${battleId}/public/battleLog/battleResult`,

  //firestore
  route_profiles: "profiles",
  profiles: (userId: string) => `profiles/${userId}`,
  bots: (userId: string) => `profiles/${userId}/bots`,
  questionnaires: (userId: string) => `profiles/${userId}/questionnaire`,
  impression: (userId: string) => `profiles/${userId}/impressions`,
  rating: (userId: string) => `profiles/${userId}/rating`,
};
