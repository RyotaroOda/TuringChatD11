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
exports.storage = exports.db = exports.auth = exports.initFirebase = void 0;
const admin = __importStar(require("firebase-admin"));
const dotenv = __importStar(require("dotenv"));
dotenv.config(); // 環境変数のロード
exports.initFirebase = admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FD_PROJECT_ID,
        clientEmail: process.env.FD_CLIENT_EMAIL,
        privateKey: process.env.FD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.FD_DATABASE_URL, // Realtime DatabaseのURLを.envから取得
});
//認証情報のインスタンス取得
exports.auth = admin.auth();
// Realtime Databaseのインスタンス取得
exports.db = admin.database();
// 初期化処理：Realtime Database の初期化
const initializeDatabase = async () => {
    try {
        // 初期化するデータ構造 (例：rooms, waitingPlayers などをクリア)
        const initialData = {
            rooms: null,
            randomMatching: null, // 待機中のプレイヤーデータを削除
        };
        // Firebase Realtime Database に初期データを設定
        await exports.db.ref().set(initialData);
        console.log("Realtime Database の初期化が完了しました。");
        console.log("Firebase Functions 準備中...ちょっとまってね...");
    }
    catch (error) {
        console.error("Realtime Database の初期化中にエラーが発生しました:", error);
    }
};
//ANCHOR - CAUTION!  サーバー起動時に初期化処理を実行
// initializeDatabase();
// Firestoreのインスタンス取得 (必要に応じて)
exports.storage = admin.storage();
