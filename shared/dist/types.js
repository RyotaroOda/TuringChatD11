"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIModel = exports.newBattleLog = exports.BattleType = void 0;
var BattleType;
(function (BattleType) {
    BattleType[BattleType["Single"] = 0] = "Single";
    BattleType[BattleType["Multi"] = 1] = "Multi";
})(BattleType || (exports.BattleType = BattleType = {}));
exports.newBattleLog = {
    currentTurn: 0,
    messages: [],
    activePlayerId: null,
};
var AIModel;
(function (AIModel) {
    AIModel[AIModel["GPT3"] = 0] = "GPT3";
    AIModel[AIModel["GPT2"] = 1] = "GPT2";
    AIModel[AIModel["default"] = 2] = "default";
})(AIModel || (exports.AIModel = AIModel = {}));
