"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newBattleLog = exports.BattleType = void 0;
var BattleType;
(function (BattleType) {
    BattleType[BattleType["Single"] = 0] = "Single";
    BattleType[BattleType["Party"] = 1] = "Party";
})(BattleType = exports.BattleType || (exports.BattleType = {}));
exports.newBattleLog = {
    currentTurn: 0,
    messages: [],
    activePlayerId: null,
};
