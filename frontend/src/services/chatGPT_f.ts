//frontend/src/services/chatGPT_f.ts
import { AIModel, GPTMessage } from "shared/dist/types";

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
  max_tokens: number; // レスポンスの最大トークン数
  temperature: number; // 応答の創造性の度合い
  top_p: number; // サンプリング時の確率マスのカットオフ
  n: number; // 返答の数
  stop: null; // 応答の終了条件を指定するストップトークン
}

// ChatGPTにリクエストを送信する関数
const generate = async (prompt: ChatGPTRequest): Promise<string> => {
  const apiUrl = process.env.REACT_APP_CHATGPT_API_URL;
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

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

  // リクエスト内容をログに出力して確認
  console.log("Prompt being sent:", JSON.stringify(prompt, null, 2));

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
  throw new Error("No content found in ChatGPT response.");
};

export const generateChat = async (messages: GPTMessage[]): Promise<string> => {
  // Implement the function logic here
  const prompt: ChatGPTRequest = {
    model: AIModel["gpt-4"],
    messages: messages,
    max_tokens: 100,
    temperature: 1.0, // 高めのランダム性を設定
    top_p: 0.9, // サンプリング時に多様なトークンを選ぶようにする
    n: 1,
    stop: null,
  };
  const answer = await generate(prompt);
  console.log("Generated answer:", answer);
  return answer;
};
