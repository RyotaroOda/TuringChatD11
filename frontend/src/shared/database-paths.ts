//database-paths.ts

// Firebase Databaseの共通パスを管理
export const DATABASE_PATHS = {
  //# region realtime database
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

  //battleRoom/public
  status: (battleId: string) => `battles/${battleId}/public/status`,

  battlePlayers: (battleId: string) => `battles/${battleId}/public/players`,
  ready: (battleId: string, playerId: string) =>
    `battles/${battleId}/public/players/${playerId}`,

  rule: (battleId: string) => `battles/${battleId}/public/battleRule`,
  // topic: (battleId: string) => `battles/${battleId}/public/battleRule/topic`,

  chatData: (battleId: string) => `battles/${battleId}/public/chatData`,
  submittedAnswers: (battleId: string) =>
    `battles/${battleId}/public/submitAnswer`,
  result: (battleId: string) => `battles/${battleId}/public/battleResult`,
  timestamps: (battleId: string) => `battles/${battleId}/public/timestamps`,

  //#endregion

  //# region firestore
  route_profiles: "profiles",
  profiles: (userId: string) => `profiles/${userId}`,
  bots: (userId: string) => `profiles/${userId}/bots`,
  questionnaires: (userId: string) => `profiles/${userId}/questionnaire`,
  impression: (userId: string) => `profiles/${userId}/impressions`,
  route_impressions: "impressions",
  rating: (userId: string) => `profiles/${userId}/rating`,
  battleBackups: (battleId: string) => `battleBackups/${battleId}`,

  //#endregion
};
