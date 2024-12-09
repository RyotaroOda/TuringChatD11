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
export const generateMessageFunction = onCall(
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
      return "";
    } catch (error) {
      console.error("Failed to generate image:", error);
      throw new Error("Failed to generate image.");
    }
  }
);
