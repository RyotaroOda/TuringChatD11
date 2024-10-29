"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBattleResultFunction = exports.testFunction = exports.cancelMatchFunction = exports.requestMatchFunction = void 0;
// backend/src/index_serverless.ts
var matchingFunctions_1 = require("./services/functions/matchingFunctions");
Object.defineProperty(exports, "requestMatchFunction", { enumerable: true, get: function () { return matchingFunctions_1.requestMatchFunction; } });
Object.defineProperty(exports, "cancelMatchFunction", { enumerable: true, get: function () { return matchingFunctions_1.cancelMatchFunction; } });
Object.defineProperty(exports, "testFunction", { enumerable: true, get: function () { return matchingFunctions_1.testFunction; } });
var battleFunctions_1 = require("./services/functions/battleFunctions");
Object.defineProperty(exports, "calculateBattleResultFunction", { enumerable: true, get: function () { return battleFunctions_1.calculateBattleResultFunction; } });
