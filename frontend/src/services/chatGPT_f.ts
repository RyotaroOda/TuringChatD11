//frontend/src/services/chatGPT_f.ts
import * as dotenv from "dotenv";
import { AIModel } from "shared/dist/types";

dotenv.config(); // 環境変数のロード

// 型定義
interface ChatGPTResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatGPTRequest {
  model: AIModel; // 使用するAIモデル
  messages: Message[];
  max_tokens: number; // レスポンスの最大トークン数
  temperature: number; // 応答の創造性の度合い
  top_p: number; // サンプリング時の確率マスのカットオフ
  n: number; // 返答の数
  stop: null; // 応答の終了条件を指定するストップトークン
}

// ChatGPTにリクエストを送信する関数
const generateChat = async (
  prompt: ChatGPTRequest
): Promise<string | undefined> => {
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

    // ChatGPT APIにリクエストを送信
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(prompt),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("Error details:", errorDetails);
      throw new Error(
        `Failed to fetch from ChatGPT API: ${response.status} - ${errorDetails}`
      );
    }

    // レスポンスからデータを取得
    const dataResponse = (await response.json()) as ChatGPTResponse;

    // トピックを取り出す
    if (dataResponse.choices && dataResponse.choices.length > 0) {
      const message = dataResponse.choices[0].message;
      if (message && message.content) {
        const topic = message.content.trim();
        return topic;
      }
    }

    console.error("No content found in ChatGPT response.");
    return;
  } catch (error) {
    console.error("Error communicating with ChatGPT API:", error);
  }
};

// トピックを生成するエクスポート関数
export const generateTopic = async (): Promise<string | undefined> => {
  // 現在の日時を取得
  const currentDate = new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });

  const message: Message[] = [
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
    top_p: 0.9, // サンプリング時に多様なトークンを選ぶようにする
    n: 1,
    stop: null,
  };

  const topic = await generateChat(prompt);

  if (topic) {
    console.log("Generated topic:", topic);
  } else {
    console.log("Failed to generate topic.");
  }

  return topic;
};
