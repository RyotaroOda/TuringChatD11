import React, { useEffect, useState } from "react";
import { AIModel, BotSetting, BotData, GPTMessage } from "shared/dist/types";
import { useLocation } from "react-router-dom";
import { updateUserProfile } from "../services/profileAPI.ts";
import { generateChat } from "../services/chatGPT_f.ts";

const EditPromptView: React.FC = () => {
  const bots: BotData = useLocation().state;
  const [botSettings, setBotSettings] = useState<BotSetting[]>(bots.data);
  const [defaultBotId, setDefaultBotId] = useState<number>(bots.defaultId);

  // 編集中のデータ
  const [selectedBotId, setSelectedBotId] = useState<number>(defaultBotId);
  const [prompt, setPrompt] = useState<string>(
    botSettings[selectedBotId].prompt
  );
  const [botName, setBotName] = useState<string>(
    botSettings[selectedBotId].name
  );
  const [model, setModel] = useState<AIModel>(botSettings[selectedBotId].model);
  const [creativity, setCreativity] = useState<number>(
    botSettings[selectedBotId].temperature
  );
  const [certainty, setCertainty] = useState<number>(
    botSettings[selectedBotId].top_p
  );

  const [isSaveEnabled, setIsSaveEnabled] = useState<boolean>(false);

  // テストチャット
  const [chatMessage, setChatMessage] = useState<GPTMessage>({
    role: "user",
    content: "",
  });
  const [chatHistory, setChatHistory] = useState<GPTMessage[]>([]);

  // ボット設定の選択が変更されたときの処理
  const handleBotSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value, 10);
    const selectedBot = botSettings.find((bot) => bot.id === value);
    if (selectedBot) {
      setSelectedBotId(selectedBot.id);
      setPrompt(selectedBot.prompt);
      setBotName(selectedBot.name);
      setModel(selectedBot.model);
      setCreativity(selectedBot.temperature);
      setCertainty(selectedBot.top_p);
      setIsSaveEnabled(false);
    }
  };

  // プロンプトの内容が変更されたときの処理
  const handlePromptChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setPrompt(event.target.value);
    setIsSaveEnabled(true);
  };

  // ボット名が変更されたときの処理
  const handleBotNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBotName(event.target.value);
    setIsSaveEnabled(true);
  };

  // ボット設定を保存する処理
  const handleSave = () => {
    if (selectedBotId !== null) {
      setBotSettings(
        botSettings.map((bot) =>
          bot.id === selectedBotId
            ? {
                ...bot,
                name: botName,
                prompt: prompt,
                model: model,
                temperature: creativity,
                top_p: certainty,
              }
            : bot
        )
      );
    }
  };

  useEffect(() => {
    updateUserProfile({
      bots: {
        defaultId: defaultBotId,
        data: botSettings,
      },
    });
    setChatHistory((prevHistory) => [
      ...prevHistory,
      { role: "system", content: "新しいプロンプトが設定されました" },
    ]);
    setIsSaveEnabled(false);
  }, [botSettings]);

  // デフォルトに設定する処理
  const handleSetDefault = () => {
    if (selectedBotId !== null) {
      setDefaultBotId(selectedBotId);
    }
  };

  useEffect(() => {
    updateUserProfile({
      bots: {
        defaultId: defaultBotId,
        data: botSettings,
      },
    });
    setChatHistory((prevHistory) => [
      ...prevHistory,
      { role: "system", content: "デフォルトに設定されました" },
    ]);
  }, [defaultBotId]);

  // チャットメッセージを送信する処理
  const handleSendMessage = async () => {
    if (chatMessage.content.trim() !== "") {
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { role: "user", content: chatMessage.content },
      ]);
      setChatMessage({ role: "user", content: "" });
      const response = await generateChat(chatHistory);
      // ボットからの応答をシミュレート
      setChatHistory((prevHistory) => [
        ...prevHistory,
        {
          role: "assistant",
          content: response,
        },
      ]);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>プロンプト編集画面</h1>
      <div style={{ marginBottom: "20px" }}>
        <h3>保存されているプロンプト</h3>
        <select
          value={selectedBotId || undefined}
          style={{ width: "100%", padding: "8px" }}
          onChange={handleBotSelection}
        >
          {botSettings.map((bot) => (
            <option key={bot.id} value={bot.id}>
              {bot.name}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <h3>名前編集</h3>
        <input
          type="text"
          value={botName}
          onChange={handleBotNameChange}
          style={{ width: "100%", padding: "8px" }}
        />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <h3>プロンプト編集</h3>
        <textarea
          rows={4}
          value={prompt}
          onChange={handlePromptChange}
          style={{ width: "100%", padding: "8px" }}
        />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <h3>設定</h3>
        <div style={{ marginBottom: "10px" }}>
          <label>モデル: </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as unknown as AIModel)}
            style={{ width: "200px", padding: "8px" }}
          >
            <option value={AIModel["gpt-4"]}>GPT-4</option>
            <option value={AIModel["gpt-4-turbo"]}>GPT-4 Turbo</option>
            <option value={AIModel["gpt-3.5-turbo"]}>GPT-3.5 Turbo</option>
          </select>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>創造性: </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={creativity}
            onChange={(e) => setCreativity(parseFloat(e.target.value))}
            style={{ width: "300px" }}
          />
          <span>{creativity}</span>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>確実性: </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={certainty}
            onChange={(e) => setCertainty(parseFloat(e.target.value))}
            style={{ width: "300px" }}
          />
          <span>{certainty}</span>
        </div>
      </div>
      <div>
        <button
          onClick={handleSave}
          disabled={!isSaveEnabled}
          style={{
            marginRight: "10px",
            padding: "10px 20px",
            cursor: isSaveEnabled ? "pointer" : "not-allowed",
          }}
        >
          保存
        </button>
        <button
          onClick={handleSetDefault}
          disabled={defaultBotId === selectedBotId}
          style={{
            padding: "10px 20px",
            cursor: defaultBotId === selectedBotId ? "not-allowed" : "pointer",
          }}
        >
          {defaultBotId === selectedBotId
            ? "デフォルトに設定中"
            : "デフォルトに設定"}
        </button>
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3>テストチャット</h3>
        <div
          style={{
            marginBottom: "10px",
            border: "1px solid #ccc",
            padding: "10px",
            height: "200px",
            overflowY: "scroll",
          }}
        >
          {chatHistory.map((message, index) => (
            <div key={index}>
              <strong>
                {message.role === "user"
                  ? "User"
                  : message.role === "assistant"
                    ? "Bot"
                    : "System"}
                :
              </strong>{" "}
              {message.content}
            </div>
          ))}
        </div>
        <input
          type="text"
          value={chatMessage.content}
          onChange={(e) =>
            setChatMessage({ role: "user", content: e.target.value })
          }
          style={{ width: "80%", padding: "8px", marginRight: "10px" }}
        />
        <button onClick={handleSendMessage} style={{ padding: "10px 20px" }}>
          送信
        </button>
      </div>
    </div>
  );
};

export default EditPromptView;
