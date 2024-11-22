//database-paths.ts
export type BattleRoomIds = {
  roomId: string;
  battleRoomId: string;
};

// Firebase Databaseの共通パスを管理
export const DATABASE_PATHS = {
  //realtime database
  //root
  route_rooms: "rooms",
  waitingPlayers: `randomMatching/waitingPlayers`,

  //room
  room: (roomId: string) => `rooms/${roomId}`,
  players: (roomId: string) => `rooms/${roomId}/players`,
  battleData: (roomId: string) => `rooms/${roomId}/battleData`,

  //battleRoom
  battleRoom: (ids: BattleRoomIds) =>
    `rooms/${ids.roomId}/battleData/${ids.battleRoomId}`,
  status: (ids: BattleRoomIds) =>
    `rooms/${ids.roomId}/battleData/${ids.battleRoomId}/status`,
  battlePlayers: (ids: BattleRoomIds) =>
    `rooms/${ids.roomId}/battleData/${ids.battleRoomId}/players`,
  ready: (ids: BattleRoomIds, playerId: string) =>
    `rooms/${ids.roomId}/battleData/${ids.battleRoomId}/players/${playerId}`,
  rules: (ids: BattleRoomIds) =>
    `rooms/${ids.roomId}/battleData/${ids.battleRoomId}/battleRules`,
  topic: (ids: BattleRoomIds) =>
    `rooms/${ids.roomId}/battleData/${ids.battleRoomId}/battleRules/topic`,
  //battleLog
  messages: (ids: BattleRoomIds) =>
    `rooms/${ids.roomId}/battleData/${ids.battleRoomId}/battleLog/messages`,
  phase: (ids: BattleRoomIds) =>
    `rooms/${ids.roomId}/battleData/${ids.battleRoomId}/battleLog/phase`,
  startBattle: (ids: BattleRoomIds) =>
    `rooms/${ids.roomId}/battleData/${ids.battleRoomId}/battleLog/timestamps/start`,
  endBattle: (ids: BattleRoomIds) =>
    `rooms/${ids.roomId}/battleData/${ids.battleRoomId}/battleLog/timestamps/end`,
  submittedAnswers: (ids: BattleRoomIds) =>
    `rooms/${ids.roomId}/battleData/${ids.battleRoomId}//battleLog/submitAnswer`,
  result: (ids: BattleRoomIds) =>
    `rooms/${ids.roomId}/battleData/${ids.battleRoomId}/battleLog/battleResult`,

  //firestore
  route_profiles: "profiles",
  profiles: (userId: string) => `profiles/${userId}`,
  bots: (userId: string) => `profiles/${userId}/bots`,
  questionnaires: (userId: string) => `profiles/${userId}/questionnaire`,
  impression: (userId: string) => `profiles/${userId}/impressions`,
  rating: (userId: string) => `profiles/${userId}/rating`,
};
