// backend/src/index_serverless.ts
export {
  requestMatchFunction,
  cancelMatchFunction,
  testFunction,
} from "./services/functions/matchingFunctions";
export { calculateBattleResultFunction } from "./services/functions/battleFunctions";
