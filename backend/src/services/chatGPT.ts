import * as dotenv from "dotenv";

dotenv.config(); // 環境変数のロード

interface ChatGPTResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}
export const generateChatTopic = async () => {
  try {
    // バトル開始時のトピック生成用のプロンプト
    const prompt = "こんにちは！";

    // ChatGPT APIにトピックをリクエスト
    const apiUrl = process.env.CHATGPT_API_URL;
    if (!apiUrl) {
      throw new Error("CHATGPT_API_URL is not defined");
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    console.log("///");
    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("Error details:", errorDetails);
      throw new Error(
        `Failed to fetch from ChatGPT API: ${response.status} - ${errorDetails}`
      );
    }
    console.log("//");

    const dataResponse = (await response.json()) as ChatGPTResponse;
    // デバッグ: dataResponse の中身を表示
    console.log("dataResponse:", JSON.stringify(dataResponse, null, 2));

    // トピックを取り出す
    const topic = dataResponse.choices?.[0]?.message?.content?.trim();

    console.log("topic", topic);

    if (!topic) {
      return;
    }
    return topic;
  } catch (error) {
    console.error("Error communicating with ChatGPT API:", error);
  }
};
