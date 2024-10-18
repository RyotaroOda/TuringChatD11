"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelMatchFunction = exports.requestMatchFunction = void 0;
// // src/index_serverless.js
var matching_f_b_1 = require("./services/functions/matching_f_b");
Object.defineProperty(exports, "requestMatchFunction", { enumerable: true, get: function () { return matching_f_b_1.requestMatchFunction; } });
Object.defineProperty(exports, "cancelMatchFunction", { enumerable: true, get: function () { return matching_f_b_1.cancelMatchFunction; } });
// // CommonJS構文に変更
// const { requestMatchFunction, cancelMatchFunction } = require('./services/functions/matching_f_b.ts');
// module.exports = {
//   requestMatchFunction,
//   cancelMatchFunction
// };
