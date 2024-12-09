//backend/src/services/chatGPT_b.ts
import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

// 環境変数の読み込み
const apiKey = process.env.OPENAI_API_KEY;
const apiUrl = process.env.OPENAI_API_URL;

// 環境変数のチェック
if (!apiUrl) {
  console.error("CHATGPT_API_URL is not defined in the environment variables.");
}
if (!apiKey) {
  console.error("OPENAI_API_KEY is not defined in the environment variables.");
}

const test = "";

export const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: apiUrl,
});
