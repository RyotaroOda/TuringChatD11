import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  CircularProgress,
  Avatar,
  Alert,
  Typography,
  Box,
  Container,
  Paper,
  Card,
  CardContent,
  Stack,
  AppBar,
  Toolbar,
  ThemeProvider,
} from "@mui/material";
import { getAuth } from "firebase/auth";
import { generateImageFront } from "../API/chatGPT_f.ts";
import { useLocation, useNavigate } from "react-router-dom";
import { ProfileData } from "../shared/types.ts";
import ImageIcon from "@mui/icons-material/Image";
import { appPaths, theme } from "../App.tsx";
import { uploadIcon } from "../API/firebase-storage_f.ts";
import { updateLastGeneratedImageDate } from "../API/firestore-database_f.ts";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

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
  const navigate = useNavigate();

  useEffect(() => {
    setCanGenerate(lastGenerate !== new Date().toLocaleDateString());
  }, [lastGenerate]);

  const handleGenerateImage = async () => {
    if (!canGenerate) {
      setError("今日はもう生成できません。");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      // base64String
      const image = await generateImageFront(prompt);
      if (!image) {
        setError("画像の生成に失敗しました。");
        return;
      }

      const dataUrl = `data:image/png;base64,${image}`;

      setGeneratedImage(dataUrl);

      if (user) {
        // Firestoreに生成日時を保存したりする処理があればここで実行
        await updateLastGeneratedImageDate();
        setCanGenerate(false);
      }
      setLastGenerate(new Date().toLocaleDateString());
    } catch (error) {
      setError("画像の生成中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetAsProfilePicture = async () => {
    if (user && generatedImage) {
      try {
        await uploadIcon(generatedImage);
        alert("プロフィール画像が更新されました。");
        navigate(appPaths.HomeView);
      } catch (error) {
        setError("プロフィール画像の更新に失敗しました。");
      }
    }
  };

  const handleKeepCurrent = () => {
    // そのままの場合は特に処理なし
    setGeneratedImage("");
    navigate(appPaths.HomeView);
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            sx={{
              textTransform: "none",
              borderColor: "#ffffff",
              color: "#ffffff",
              ":hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
            onClick={() => navigate("/")}
          >
            戻る
          </Button>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            アイコン画像生成
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            あなたの好みに合わせたアイコン画像を生成します。
            <br />
            プロンプトを入力して「画像生成」ボタンを押してください。
          </Typography>
        </Box>

        <Card
          sx={{
            padding: 4,
            borderRadius: 2,
            boxShadow: 3,
            mb: 4,
            textAlign: "center",
          }}
        >
          <CardContent>
            <Typography variant="h5" component="h3" gutterBottom>
              現在のアイコン
            </Typography>
            <Avatar
              src={user?.photoURL || ""}
              alt="現在のアイコン"
              sx={{ width: 200, height: 200, margin: "auto" }}
            />
          </CardContent>
        </Card>

        {generatedImage ? (
          <Card
            sx={{
              padding: 4,
              borderRadius: 2,
              boxShadow: 3,
              mb: 4,
              textAlign: "center",
            }}
          >
            <CardContent>
              <Typography variant="h5" component="h3" gutterBottom>
                新しく生成されたアイコン
              </Typography>
              <Avatar
                src={generatedImage}
                alt="新しいアイコン"
                sx={{ width: 200, height: 200, margin: "auto", mb: 3 }}
              />
              <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSetAsProfilePicture}
                >
                  新しいアイコンを設定
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleKeepCurrent}
                >
                  そのまま
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Paper sx={{ p: 4, mb: 4 }} elevation={3}>
            <Stack spacing={3}>
              <TextField
                label="プロンプトを入力"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                fullWidth
                variant="outlined"
              />
              <Box sx={{ textAlign: "center" }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateImage}
                  disabled={isLoading || !canGenerate || !prompt}
                  startIcon={
                    isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <ImageIcon />
                    )
                  }
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: "1rem",
                    borderRadius: 2,
                  }}
                >
                  {isLoading ? "生成中…" : "画像生成"}
                </Button>
              </Box>

              {lastGenerate && (
                <Typography variant="body2" color="text.secondary">
                  最終生成日時: {lastGenerate} (画像生成は1日1回まで)
                </Typography>
              )}

              {canGenerate ? (
                <Typography variant="body2" color="text.secondary">
                  画像生成が可能です。
                </Typography>
              ) : (
                <Typography variant="body2" color="red">
                  今日はもう生成できません。
                </Typography>
              )}

              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </Paper>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default IconGenerator;
