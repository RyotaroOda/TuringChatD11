// frontend/src/services/chatGPT_f.ts
import {
  AIModel,
  BattleRules,
  BotSetting,
  GPTMessage,
  Message,
} from "../shared/types.ts";
import { addMessage } from "./firebase-realtime-database.ts";
import { auth } from "./firebase_f.ts";

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
 * テストメッセージ生成用関数
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
  log: Message[],
  instruction: string,
  bot: BotSetting,
  config: BattleRules
): Promise<string> => {
  const myId = auth.currentUser?.uid;
  console.log("log", log);
  const chatLog: GPTMessage[] = log.map((message) => {
    return {
      role: "user",
      content:
        (message.senderId === "system"
          ? "[system]"
          : message.senderId === myId
            ? "[proponent]"
            : "[opponent]") + message.message,
    };
  });

  // システムメッセージの作成
  const systemMessage: GPTMessage = {
    role: "system",
    content: `あなたはプレイヤーのアシスタントとしてチャットゲームに参加しています。
      あなたはプレイヤーになりきって、新たに相手に送信するメッセージを生成してください。
      あなたは[proponent]として表示されます。
      
      # ゲームルール
      - ゲームの参加者はプレイヤー(自分)と相手プレイヤーの2人です。
      - メッセージの入力時間: ${config.oneTurnTime}秒
      - メッセージ終了ターン: ${config.maxTurn}ターン

      # 出力形式
      - 返信メッセージのみ（Messageのcontent内容のみ）を出力してください。
      - 先頭の[proponent]は主力に含めないでください。
      - 出力がそのまま相手プレイヤーに送信されます。

      # カスタムプロンプト
      - 以下のプレイヤーが事前に設定したカスタムプロンプトに従って生成してください:
        ${bot.prompt}

      # プレイヤー指示
      - 以下のプレイヤー指示はあなたへのリアルタイムの指示です:
        ${instruction}

      # メッセージログ
      - 以下に今までのゲームのチャットログを送信します。
      - ゲーム開始時のトークテーマはAIで自動生成され、メッセージの先頭に[system]と表示されます。
      - プレイヤー(自分)は[proponent], 相手プレイヤーは[opponent]とメッセージの先頭に表示されます。
    `,
  };

  const prompt: ChatGPTRequest = {
    model: AIModel[bot.model],
    messages: [systemMessage, ...chatLog],
    max_tokens: 100,
    temperature: bot.temperature,
    top_p: bot.top_p,
    n: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: null,
  };

  console.log("Sending prompt to ChatGPT:", JSON.stringify(prompt, null, 2));
  const answer = await generate(prompt);
  console.log("Generated Battle Message:", answer);
  return answer;
};

/**
 * トピックを生成する関数
 * @returns 生成されたトピック
 */
export const generateTopic = async (battleId: string) => {
  // GPT-4に送信するシステムメッセージ
  const message: GPTMessage[] = [
    {
      role: "system",
      content: `ランダムに会話の話題を設定して、チャットの最初のメッセージを生成してください。
      メッセージは具体的で20〜30文字で返信できる疑問形にして下さい。
      出力形式は「話題: XXX」の形で話題の内容のみを回答してください。`,
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
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  try {
    const topic = await generate(prompt);
    console.log("Generated topic:", topic);

    addMessage(battleId, topic, 0, null);
  } catch (error) {
    console.error("Failed to generate topic:", error);
    throw new Error("Failed to generate topic.");
  }
};
