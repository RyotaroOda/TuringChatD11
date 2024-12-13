// frontend/src/services/chatGPT_f.ts
import { variables } from "../App.tsx";
import {
  AIModel,
  BattleRules,
  BotSetting,
  GPTMessage,
  Message,
} from "../shared/types.ts";
import { Difficulty } from "../views/SingleBattleView.tsx";
import {
  generateImageBack,
  generateMessageBack,
} from "./firebase-functions-client.ts";
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

export interface ChatGPTRequest {
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

/**ChatGPT APIにリクエストを送信し、応答を取得
 * @param prompt ChatGPTへのリクエスト内容
 * @returns 応答のテキスト
 * @throws APIのエラーやレスポンスの欠落
 */
const generate = async (prompt: ChatGPTRequest): Promise<any> => {
  if (variables.disableClientGeneration) {
    return await generateMessageBack(prompt);
  } else {
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
        return message.content;
      }
    }

    throw new Error("No content found in ChatGPT response.");
  }
};

/** テストメッセージ生成用関数
 * @param messages 会話履歴
 * @returns ChatGPTの応答
 */
export const generateTestMessage = async (
  messages: GPTMessage[]
): Promise<string> => {
  const sysMes: GPTMessage = {
    role: "system",
    content:
      "以下のメッセージに対して返信を生成してください。文字数は1~50文字の範囲で生成して下さい。",
  };

  const prompt: ChatGPTRequest = {
    model: AIModel["gpt-4-turbo"],
    messages: [sysMes, ...messages],
    max_tokens: variables.maxToken,
    temperature: 1.0, // 高ランダム性
    top_p: 0.9,
    n: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: null,
  };
  console.log("Sending prompt to ChatGPT:", JSON.stringify(prompt, null, 2));
  const answer = await generate(prompt);
  console.log("Generated Chat Response:", answer);
  return answer;
};

/** バトル用メッセージ生成関数
 * @param log チャットの履歴ログ
 * @param instruction リアルタイム指示
 * @param bot Botの設定
 * @param config バトル設定
 * @returns ChatGPTの応答メッセージ
 */
export const generateBattleMessage = async (
  log: Message[],
  topic: string,
  instruction: string,
  bot: BotSetting,
  config: BattleRules
): Promise<string> => {
  const myId = auth.currentUser?.uid;
  const chatLog: GPTMessage[] = log.length
    ? log
        .filter((message) => message.message) // Filter out messages with empty content
        .map((message) => ({
          role: "user",
          content:
            (message.senderId === "system"
              ? "[system]"
              : message.senderId === myId
                ? "[proponent]"
                : "[opponent]") + message.message,
        }))
    : []; // Return an empty array if log is empty

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
      - 出力がそのまま相手プレイヤーに送信されます
      - 先頭の[proponent]や[opponent]は出力に含めないでください。
      - 対象年齢: ${variables.targetAge} 向けのメッセージを生成してください。

      # カスタムプロンプト
      - 以下のプレイヤーが事前に設定したカスタムプロンプトに従って生成してください:
        {${bot.prompt}}

      # プレイヤー指示
      - 以下のプレイヤー指示はあなたへのリアルタイムの指示です:
        {${instruction}}

      # メッセージログ
      - 以下に今までのゲームのチャットログを送信します。
      - ゲーム開始時のトークテーマはAIで自動生成され、メッセージの先頭に[system]と表示されます。
      - プレイヤー(自分)は[proponent], 相手プレイヤーは[opponent]とメッセージの先頭に表示されます。

      トピック：${topic}
    `,
  };

  const prompt: ChatGPTRequest = {
    model: AIModel[bot.model],
    messages: [systemMessage, ...chatLog],
    max_tokens: variables.maxToken,
    temperature: bot.temperature,
    top_p: bot.top_p,
    n: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: null,
  };

  console.log("Sending prompt to ChatGPT:", JSON.stringify(prompt, null, 2));
  const generated = await generate(prompt);
  console.log("generated", generated);

  //余計な文字列を削除
  function removeSubstring(originalString, substring) {
    return originalString.replace(new RegExp(substring, "g"), "");
  }
  const answer = removeSubstring(
    removeSubstring(generated, "[proponent]"),
    "[opponent]"
  ).replace(/\[\]/g, ""); // 空の[]を削除;
  return answer;
};

/**トピックを生成する関数
 * @returns 生成されたトピック
 */
export const generateTopic = async (battleId: string) => {
  // GPT-4に送信するシステムメッセージ
  const message: GPTMessage[] = [
    {
      role: "system",
      content: `ランダムに会話の話題を設定して、チャットの最初のメッセージを生成してください。
      メッセージは具体的で20〜30文字で返信できる疑問形にして下さい。
      出力形式は「話題: XXX」の形で話題の内容のみを回答してください。
      対象年齢: ${variables.targetAge} 向けのメッセージを生成してください。
`,
    },
  ];

  const prompt: ChatGPTRequest = {
    model: AIModel["gpt-4"],
    messages: message,
    max_tokens: variables.maxToken,
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

export const generateImageFront = async (prompt: string) => {
  if (variables.disableClientGeneration) {
    return await generateImageBack(prompt);
  } else {
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
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        prompt,
        n: 1,
        size: "512x512",
      }),
    });
    console.log(response);
    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("OpenAI API Error Details:", errorDetails);
      throw new Error(
        `Failed to fetch from OpenAI API: ${response.status} - ${errorDetails}`
      );
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;
    console.log(imageUrl);
    return imageUrl;
    // try {
    //   const response = await openai.images.generate({
    //     model: "dall-e-3",
    //     prompt: "a white siamese cat",
    //     n: 1,
    //     size: "512x512",
    //   });

    //   const imageUrl = response.data[0].url;

    //   return imageUrl;
    // } catch (error) {
    //   console.error("Failed to generate image:", error);
    //   throw new Error("Failed to generate image.");
    // }
  }
};

export const generateSingleMessage = async (
  bot: BotSetting,
  messages: GPTMessage[],
  topic: string
) => {
  const requestMessages: GPTMessage[] = messages.map((message) => {
    const newRole = message.role === "user" ? "assistant" : "user";
    return { role: newRole, content: message.content };
  });
  const prompt: GPTMessage = {
    role: "system",
    content: `以下のプロンプトに従って次に送信するメッセージを生成してください。
          プロンプト：{${bot.prompt}}

    # 出力形式
    - 返信メッセージのみ（Messageのcontent内容のみ）を出力してください。
    - 出力がそのまま相手プレイヤーに送信されます。
    - 対象年齢: ${variables.targetAge} 向けのメッセージを生成してください。
    - トピック: ${topic}

    # メッセージログ
    - 以下に今までのゲームのチャットログを送信します。あなたはassistantとして表示され、相手はuserとして表示されます。
    `,
  };

  const request: ChatGPTRequest = {
    model: AIModel["gpt-4"],
    messages: [prompt, ...requestMessages],
    max_tokens: variables.maxToken,
    temperature: 1.0,
    top_p: 0.9,
    n: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: null,
  };

  console.log("Sending prompt to ChatGPT:", JSON.stringify(request, null, 2));
  const response = await generate(request);
  return response;
};

export const AIJudgement = async (
  messages: GPTMessage[],
  topic: string,
  difficulty: Difficulty
) => {
  const prompt = `あなたはチャットゲームの審判として参加しています。
  以下は、プレイヤーとCPUプレイヤーとのメッセージログです。プレイヤーが人間かAIかを判断し、その理由と共に出力してください。
  その際、言語パターン、文法構造、独自性などを考慮してください。
  理由は具体的な理由を日本語で簡潔に説明して下さい。
  対象年齢: ${variables.targetAge} 向けのメッセージを生成してください。
  トピック: ${topic}
  {${messages.map((message) => message.content).join("\n")}}

  結果を以下のJSON形式で出力してください:
  {
    "isHuman": boolean,
    "reason": string
  }\n
    "reason" には、判断に至った具体的な理由を簡潔に説明してください。

`;
  const model: AIModel =
    difficulty === "初級"
      ? AIModel["gpt-3.5-turbo"]
      : difficulty === "上級"
        ? AIModel["gpt-4"]
        : AIModel["gpt-4-turbo"];
  const request: ChatGPTRequest = {
    model: model,
    messages: [
      {
        role: "system",
        content: prompt,
      },
    ],
    max_tokens: 1000, // JSONが壊れないように
    temperature: 0.7,
    top_p: 0.9,
    n: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: null,
  };
  try {
    const response = await generate(request);
    console.log("API Response:", response);
    return response;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
  }
};

export const generateSingleTopic = async (): Promise<string> => {
  // GPT-4に送信するシステムメッセージ
  const message: GPTMessage[] = [
    {
      role: "system",
      content: `ランダムに会話の話題を設定して、チャットの最初のメッセージを生成してください。
      メッセージは具体的で20〜30文字で返信できる疑問形にして下さい。
      出力形式は「話題: XXX」の形で話題の内容のみを回答してください。
      対象年齢: ${variables.targetAge} 向けのメッセージを生成してください。
`,
    },
  ];

  const prompt: ChatGPTRequest = {
    model: AIModel["gpt-4"],
    messages: message,
    max_tokens: variables.maxToken,
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
    return topic;
  } catch (error) {
    console.error("Failed to generate topic:", error);
    throw new Error("Failed to generate topic.");
  }
};
