// backend/src/index_serverless.ts
export {
  requestMatchFunction,
  cancelMatchFunction,
} from "./services/functions/matchingFunctions";
export { calculateBattleResultFunction } from "./services/functions/battleFunctions";

export { testFunction } from "./services/functions/matchingFunctions";
