"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.firestore = exports.db = exports.initFirebase = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const dotenv = __importStar(require("dotenv"));
// import * as serviceAccount from '../../firebase-service-account.json';  // サービスアカウントキーのパス
// import { ServiceAccount } from "firebase-admin";
dotenv.config(); // 環境変数のロード
exports.initFirebase = admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FD_PROJECT_ID,
        clientEmail: process.env.FD_CLIENT_EMAIL,
        privateKey: process.env.FD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.FD_DATABASE_URL, // Realtime DatabaseのURLを.envから取得
});
// Realtime Databaseのインスタンス取得
exports.db = admin.database();
// Firestoreのインスタンス取得 (必要に応じて)
exports.firestore = (0, firestore_1.getFirestore)();
//認証情報のインスタンス取得
exports.auth = admin.auth();
