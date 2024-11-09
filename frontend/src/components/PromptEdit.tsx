// frontend/src/components/PromptEdit.tsx
import React, { useState, useEffect } from "react";

// プロンプトのインターフェース定義
interface Prompt {
  id: number;
  name: string;
  content: string;
}

const EditPromptView: React.FC = () => {
  // プロンプトのリストを管理する状態
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  // 選択されたプロンプトのIDを管理する状態
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  // 現在編集中のプロンプトの内容を管理する状態
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  // モデルの選択を管理する状態
  const [model, setModel] = useState<string>("gpt-4");
  // 創造性の値を管理する状態（0から1まで）
  const [creativity, setCreativity] = useState<number>(0.7);
  // 確実性の値を管理する状態（0から1まで）
  const [certainty, setCertainty] = useState<number>(1);
  // 保存ボタンの有効/無効を管理する状態
  const [isSaveEnabled, setIsSaveEnabled] = useState<boolean>(false);
  // チャットメッセージの入力を管理する状態
  const [chatMessage, setChatMessage] = useState<string>("");
  // チャット履歴を管理する状態
  const [chatHistory, setChatHistory] = useState<string[]>([]);

  // コンポーネントのマウント時に保存されたプロンプトをロード
  useEffect(() => {
    const savedPrompts: Prompt[] = [
      { id: 1, name: "Default Prompt", content: "This is the default prompt." },
      {
        id: 2,
        name: "Creative Prompt",
        content: "A prompt with more creative energy.",
      },
    ];
    setPrompts(savedPrompts);
    // 初期選択として「Default Prompt」を設定
    setSelectedPromptId(savedPrompts[0].id);
    setCurrentPrompt(savedPrompts[0].content);
  }, []);

  // プロンプトの選択が変更されたときの処理
  const handlePromptSelection = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = parseInt(event.target.value, 10);
    const selectedPrompt = prompts.find((prompt) => prompt.id === value);
    if (selectedPrompt) {
      setSelectedPromptId(selectedPrompt.id);
      setCurrentPrompt(selectedPrompt.content);
      setIsSaveEnabled(false);
    }
  };

  // プロンプトの内容が変更されたときの処理
  const handlePromptChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setCurrentPrompt(event.target.value);
    setIsSaveEnabled(true);
  };

  // プロンプトを保存する処理
  const handleSave = () => {
    if (selectedPromptId !== null) {
      setPrompts((prevPrompts) =>
        prevPrompts.map((prompt) =>
          prompt.id === selectedPromptId
            ? { ...prompt, content: currentPrompt }
            : prompt
        )
      );
      setIsSaveEnabled(false);
      saveBot();
      setChatHistory((prevHistory) => [
        ...prevHistory,
        "システム: プロンプトが更新されました",
      ]);
    }
  };

  // プロンプトを保存するためのプレースホルダ関数
  const saveBot = () => {
    console.log("Prompt saved:", currentPrompt);
  };

  // チャットメッセージを送信する処理
  const handleSendMessage = () => {
    if (chatMessage.trim() !== "") {
      setChatHistory((prevHistory) => [...prevHistory, `User: ${chatMessage}`]);
      setChatMessage("");
      // ボットからの応答をシミュレート
      setChatHistory((prevHistory) => [
        ...prevHistory,
        `Bot: Response to "${chatMessage}" based on current prompt.`,
      ]);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>プロンプト編集画面</h1>
      <div style={{ marginBottom: "20px" }}>
        <h3>保存されているプロンプト</h3>
        <select
          value={selectedPromptId || undefined}
          style={{ width: "100%", padding: "8px" }}
          onChange={handlePromptSelection}
        >
          {prompts.map((prompt) => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.name}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <h3>プロンプト編集</h3>
        <textarea
          rows={4}
          value={currentPrompt}
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
            onChange={(e) => setModel(e.target.value)}
            style={{ width: "200px", padding: "8px" }}
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5">GPT-3.5</option>
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
            <div key={index}>{message}</div>
          ))}
        </div>
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
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
