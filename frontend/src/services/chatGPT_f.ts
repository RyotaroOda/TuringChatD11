// frontend/src/services/chatGPT_f.ts
import {
  AIModel,
  BattleConfig,
  BotSetting,
  GPTMessage,
} from "../shared/types.ts";

interface ChatGPTResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

interface ChatGPTRequest {
  model: AIModel;
  messages: GPTMessage[];
  max_tokens: number;
  temperature: number;
  top_p: number;
  n: number;
  frequency_penalty: number;
  presence_penalty: number;
  stop: null | string[];
}

/**
 * ChatGPT APIにリクエストを送信し、応答を取得
 * @param prompt ChatGPTへのリクエスト内容
 * @returns 応答のテキスト
 * @throws APIのエラーやレスポンスの欠落
 */
const generate = async (prompt: ChatGPTRequest): Promise<string> => {
  const apiUrl = process.env.REACT_APP_CHATGPT_API_URL;
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  // 環境変数の検証
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

  console.log("Sending prompt to ChatGPT:", JSON.stringify(prompt, null, 2));

  // ChatGPT APIリクエストの送信
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
    console.error("ChatGPT API Error Details:", errorDetails);
    throw new Error(
      `Failed to fetch from ChatGPT API: ${response.status} - ${errorDetails}`
    );
  }

  // レスポンスの解析
  const dataResponse = (await response.json()) as ChatGPTResponse;
  if (dataResponse.choices && dataResponse.choices.length > 0) {
    const message = dataResponse.choices[0].message;
    if (message?.content) {
      return message.content.trim();
    }
  }

  throw new Error("No content found in ChatGPT response.");
};

/**
 * メッセージ生成用関数
 * @param messages 会話履歴
 * @returns ChatGPTの応答
 */
export const generateChat = async (messages: GPTMessage[]): Promise<string> => {
  const prompt: ChatGPTRequest = {
    model: AIModel["gpt-4"],
    messages,
    max_tokens: 100,
    temperature: 1.0, // 高ランダム性
    top_p: 0.9,
    n: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: null,
  };

  const answer = await generate(prompt);
  console.log("Generated Chat Response:", answer);
  return answer;
};

/**
 * バトル用メッセージ生成関数
 * @param log チャットの履歴ログ
 * @param instruction リアルタイム指示
 * @param bot Botの設定
 * @param config バトル設定
 * @returns ChatGPTの応答メッセージ
 */
export const generateBattleMessage = async (
  log: GPTMessage[],
  instruction: string,
  bot: BotSetting,
  config: BattleConfig
): Promise<string> => {
  // システムメッセージの作成
  const systemMessage: GPTMessage = {
    role: "system",
    content: `
      あなたはプレイヤーのアシスタントとしてチャットゲームに参加しています。
      あなたはプレイヤーになりきって、新たに相手に送信するメッセージを生成してください。
      
      # ゲームルール
      - ゲームの参加者はプレイヤー(自分)と相手プレイヤーの2人です。
      - メッセージの入力時間: ${config.oneTurnTime}秒
      - メッセージ終了ターン: ${config.maxTurn}ターン
      - トークテーマ: ${config.topic}

      # 出力形式
      - 返信メッセージのみ（Messageのcontent内容のみ）を出力してください。出力がそのまま相手プレイヤーに送信されます。

      # カスタムプロンプト
      - 以下のプレイヤーが事前に設定したカスタムプロンプトに従って生成してください:
        ${bot.prompt}

      # プレイヤー指示
      - 以下のプレイヤー指示はあなたへのリアルタイムの指示です:
        ${instruction}

      # メッセージログ
      - 以下に今までのゲームのチャットログを送信します。
      - ゲーム開始時のトークテーマはAIで自動生成され、メッセージの先頭に[AI]と表示されます。
      - プレイヤー(自分)は[proponent], 相手プレイヤーは[opponent]とメッセージの先頭に表示されます。
    `,
  };

  // プロンプトの構築
  const messages: GPTMessage[] = [
    systemMessage,
    ...log,
    { role: "user", content: "メッセージを生成して" },
  ];

  const prompt: ChatGPTRequest = {
    model: AIModel[bot.model],
    messages,
    max_tokens: 100,
    temperature: bot.temperature,
    top_p: bot.top_p,
    n: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: null,
  };

  const answer = await generate(prompt);
  console.log("Generated Battle Message:", answer);
  return answer;
};
