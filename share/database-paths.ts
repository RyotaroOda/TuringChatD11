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
  battle: (battleId: string) => `battles/${battleId}`,
  private: (playerId: string) => `private/${playerId}`,

  //room
  players: (roomId: string) => `rooms/${roomId}/players`,

  //battle
  battleRoom: (battleId: string) => `battles/${battleId}`,
  status: (battleId: string) => `battles/${battleId}/status`,
  battlePlayers: (battleId: string) => `battles/${battleId}/players`,
  ready: (battleId: string, playerId: string) =>
    `battles/${battleId}/players/${playerId}`,
  rules: (battleId: string) => `battles/${battleId}/battleRules`,
  topic: (battleId: string) => `battles/${battleId}/battleRules/topic`,

  //battle/battleLog
  messages: (battleId: string) => `battles/${battleId}/battleLog/messages`,
  phase: (battleId: string) => `battles/${battleId}/battleLog/phase`,
  startBattle: (battleId: string) =>
    `battles/${battleId}/battleLog/timestamps/start`,
  endBattle: (battleId: string) =>
    `battles/${battleId}/battleLog/timestamps/end`,
  submittedAnswers: (battleId: string) =>
    `battles/${battleId}//battleLog/submitAnswer`,
  result: (battleId: string) => `battles/${battleId}/battleLog/battleResult`,

  //firestore
  route_profiles: "profiles",
  profiles: (userId: string) => `profiles/${userId}`,
  bots: (userId: string) => `profiles/${userId}/bots`,
  questionnaires: (userId: string) => `profiles/${userId}/questionnaire`,
  impression: (userId: string) => `profiles/${userId}/impressions`,
  rating: (userId: string) => `profiles/${userId}/rating`,
};
