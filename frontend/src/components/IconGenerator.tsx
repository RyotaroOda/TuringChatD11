import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  CircularProgress,
  Avatar,
  Alert,
} from "@mui/material";
import { getAuth, updateProfile } from "firebase/auth";
import { generateImageFront } from "../API/chatGPT_f.ts";
import { useLocation } from "react-router-dom";
import { updateLastGeneratedImageDate } from "../API/firestore-database_f.ts";
import { ProfileData } from "../shared/types.ts";

const IconGenerator: React.FC = () => {
  const profile: ProfileData = useLocation().state;
  const [lastGenerate, setLastGenerate] = useState<string>(
    profile.lastGeneratedImageDate
  );
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string>("");
  const [error, setError] = useState("");
  const [canGenerate, setCanGenerate] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    setCanGenerate(lastGenerate === new Date().toDateString());
  }, [lastGenerate]);

  const handleGenerateImage = async () => {
    if (!canGenerate) {
      setError("今日はもう生成できません。");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const image = await generateImageFront(prompt);
      if (!image) {
        setError("画像の生成に失敗しました。");
        return;
      }
      setGeneratedImage(image);

      // 生成日時をFirestoreに保存
      if (user) {
        updateLastGeneratedImageDate();
        setCanGenerate(false);
      }
      setLastGenerate(new Date().toDateString());
    } catch (error) {
      setError("画像の生成中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetAsProfilePicture = async () => {
    if (user && generatedImage) {
      try {
        await updateProfile(user, {
          photoURL: generatedImage,
        });
        alert("プロフィール画像が更新されました。");
      } catch (error) {
        setError("プロフィール画像の更新に失敗しました。");
      }
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>アイコン画像生成</h2>
      <TextField
        label="プロンプトを入力"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleGenerateImage}
        disabled={isLoading || !canGenerate}
      >
        画像生成
      </Button>

      {lastGenerate && <p>最終生成日時: {lastGenerate}</p>}
      {isLoading && <CircularProgress style={{ marginTop: "20px" }} />}
      {canGenerate ? (
        <p>画像生成ができます。</p>
      ) : (
        <p>画面上の画像生成は1日1回までです。</p>
      )}
      {error && (
        <Alert severity="error" style={{ marginTop: "20px" }}>
          {error}
        </Alert>
      )}

      {generatedImage && (
        <div style={{ marginTop: "30px" }}>
          <h3>生成された画像</h3>
          <Avatar
            src={user?.photoURL || ""}
            alt="現在のアイコン"
            style={{ width: 100, height: 100, margin: "10px" }}
          />
          <Avatar
            src={generatedImage}
            alt="新しいアイコン"
            style={{ width: 100, height: 100, margin: "10px" }}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSetAsProfilePicture}
          >
            この画像をアイコンに設定
          </Button>
        </div>
      )}
    </div>
  );
};

export default IconGenerator;
