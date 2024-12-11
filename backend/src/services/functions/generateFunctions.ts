//backend/src/services/functions/generateFunctions.ts
import { onCall } from "firebase-functions/v2/https";
import { AIModel, GPTMessage } from "../../shared/types";
import { openai } from "../chatGPT_b";

// 型定義
interface ChatGPTRequest {
  model: AIModel; // 使用するAIモデル
  messages: GPTMessage[];
  max_tokens: number; // 最大トークン数
  temperature: number; // 応答の創造性の度合い
  top_p: number; // サンプリング時の確率マスのカットオフ
  n: number; // 返答の数f
  stop: null; // 応答の終了条件を指定するストップトークン
}

// ChatGPTのメッセージ生成関数
export const generateMessageFunction = onCall(async (request) => {
  const GPTRequest = request.data.messages as ChatGPTRequest;
  try {
    // const response = await openai.chat.completions.create(GPTRequest);
    // console.log(response.choices[0].message.content);
    // if (response.choices[0].message.content) {
    //   return response.choices[0].message.content;
    // } else {
    //   return "No content found in ChatGPT response.";
    // }
    const data = await generate(GPTRequest);
    return data;
  } catch (error) {
    console.error("Failed to generate image:", error);
    throw new Error("Failed to generate image.");
  }
});

// DALL-Eの画像生成関数
export const generateImageFunction = onCall(
  async (request): Promise<string> => {
    const prompt =
      request.data.prompt === "" ? "default prompt" : request.data.prompt;
    try {
      // const response = await openai.images.generate({
      //   model: "dall-e-2",
      //   prompt: prompt,
      //   response_format: "b64_json",
      //   n: 1,
      //   size: "256x256",
      // });
      // const imageUrl = response.data[0].b64_json;
      // console.log("success to generate image");
      // if (imageUrl) return imageUrl;
      const image = await generateImage(prompt);
      return image;
    } catch (error) {
      console.error("Failed to generate image:", error);
      throw new Error("Failed to generate image.");
    }
  }
);

//#region fetch

interface ChatGPTResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

const generate = async (prompt: ChatGPTRequest): Promise<string> => {
  try {
    const apiUrl = "https://api.openai.com/v1/chat/completions";
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
      const errorDetails = await response.text(); // ←ここはawaitで確実にテキスト取得
      console.error("ChatGPT API Error details:", errorDetails);
      throw new Error(
        `Failed to fetch from ChatGPT API: ${response.status} - ${errorDetails}`
      );
    }

    // レスポンスをJSONにパース
    const responseData = (await response.json()) as ChatGPTResponse;

    // ChatGPTのレスポンスからメッセージを取得
    return responseData.choices[0].message.content;
  } catch (error) {
    console.error("Failed to generate message:", error);
    throw new Error("Failed to generate message.");
  }
};

interface ImageResponse {
  created: number;
  data: Array<{
    b64_json: string;
  }>;
}

const generateImage = async (prompt: string): Promise<string> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not defined in environment variables.");
  }

  const requestBody = {
    prompt: prompt,
    n: 1,
    size: "256x256",
    response_format: "b64_json",
  };

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI Image API error:", errorText);
    throw new Error(`Image generation failed: ${response.statusText}`);
  }

  const responseData = (await response.json()) as ImageResponse;
  const b64Image = responseData.data[0].b64_json;
  return b64Image;
};
//#endregion
