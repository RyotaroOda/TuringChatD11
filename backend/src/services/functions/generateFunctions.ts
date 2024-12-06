//backend/src/services/functions/generateFunctions.ts
import * as functions from "firebase-functions";
import { AIModel, GPTMessage } from "../../shared/types";
import OpenAI from "openai";
import * as dotenv from "dotenv";

// 型定義
interface ChatGPTResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

interface ChatGPTRequest {
  model: AIModel; // 使用するAIモデル
  messages: GPTMessage[];
  max_tokens: number; // 最大トークン数
  temperature: number; // 応答の創造性の度合い
  top_p: number; // サンプリング時の確率マスのカットオフ
  n: number; // 返答の数
  stop: null; // 応答の終了条件を指定するストップトークン
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_URL,
});
dotenv.config(); // 環境変数をロード

export const generateMessageFunction = functions.https.onCall(
  async (request): Promise<string> => {
    const GPTRequest = request.data.messages as ChatGPTRequest;
    try {
      const response = await openai.chat.completions.create(GPTRequest);
      console.log(response.choices[0].message.content);
      if (response.choices[0].message.content) {
        return response.choices[0].message.content;
      } else {
        return "No content found in ChatGPT response.";
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
      throw new Error("Failed to generate image.");
    }
  }
);

export const generateImageFunction = functions.https.onCall(
  async (request): Promise<string> => {
    const prompt =
      request.data.prompt === "" ? "default prompt" : request.data.prompt;
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = response.data[0].url;
      if (imageUrl) return imageUrl;
      return "";
    } catch (error) {
      console.error("Failed to generate image:", error);
      throw new Error("Failed to generate image.");
    }
  }
);

/**
 * ChatGPT APIにリクエストを送信し、応答を取得する関数
 * @param prompt ChatGPT APIへのリクエスト内容
 * @returns ChatGPTからの応答テキスト
 */
const generate = async (prompt: ChatGPTRequest): Promise<string> => {
  try {
    const apiUrl = process.env.CHATGPT_API_URL;
    const apiKey = process.env.OPENAI_API_KEY;

    // 環境変数のチェック
    if (!apiUrl) {
      throw new Error(
        "CHATGPT_API_URL is not defined in the environment variables."
      );
    }
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not defined in the environment variables."
      );
    }

    console.log("Sending to ChatGPT...");

    // ChatGPT APIにリクエストを送信
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(prompt),
    });

    // エラーハンドリング
    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("ChatGPT API Error details:", errorDetails);
      throw new Error(
        `Failed to fetch from ChatGPT API: ${response.status} - ${errorDetails}`
      );
    }

    // レスポンスの解析
    const dataResponse = (await response.json()) as ChatGPTResponse;
    const messageContent = dataResponse.choices?.[0]?.message?.content;

    if (messageContent) {
      return messageContent.trim();
    }

    throw new Error("No content found in ChatGPT response.");
  } catch (error) {
    console.error("Error communicating with ChatGPT API:", error);
    throw new Error("Error communicating with ChatGPT API");
  }
};

/** トピックを生成する関数
 * @returns 生成されたトピック
 */
export const generateTopic = async (): Promise<string> => {
  // GPT-4に送信するシステムメッセージ
  const message: GPTMessage[] = [
    {
      role: "system",
      content: `子供向けにランダムに会話の話題を設定してください。回答の形式は「話題: XXX」の形で話題の内容のみを回答してください。`,
    },
  ];

  const prompt: ChatGPTRequest = {
    model: AIModel["gpt-4"],
    messages: message,
    max_tokens: 100,
    temperature: 1.0, // 高めのランダム性を設定
    top_p: 0.9, // 多様性を考慮したトークン選択
    n: 1,
    stop: null,
  };

  try {
    const topic = await generate(prompt);
    console.log("Generated topic:", topic);
    return topic;
  } catch (error) {
    console.error("Failed to generate topic:", error);
    throw new Error("Failed to generate topic.");
  }
};
