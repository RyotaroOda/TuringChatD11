"use strict";
//types.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIModel = void 0;
var AIModel;
(function (AIModel) {
    AIModel[AIModel["gpt-4"] = 0] = "gpt-4";
    AIModel[AIModel["gpt-4-turbo"] = 1] = "gpt-4-turbo";
    AIModel[AIModel["gpt-3.5-turbo"] = 2] = "gpt-3.5-turbo";
})(AIModel || (exports.AIModel = AIModel = {}));
