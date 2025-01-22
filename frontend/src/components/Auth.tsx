import React, { useState } from "react";
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../API/firebase_f.ts";
import { useNavigate } from "react-router-dom";
import { createUserProfile } from "../API/firestore-database_f.ts";

import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  palette: {
    primary: { main: "#1976d2" },
    background: { default: "#f5f5f5" },
  },
});

const Auth: React.FC = () => {
  //#region 状態管理
  const [activeStep, setActiveStep] = useState(0);
  // ステップは3つに変更
  const steps = ["ようこそ", "入力", "開始"];

  const [isLoginMode, setIsLoginMode] = useState<null | boolean>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  //#endregion

  //#region ログイン処理
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      alert("ログインに成功しました。");
      // ログイン後は最終ステップへ
      setActiveStep((prev) => prev + 1);
    } catch (error: any) {
      console.error("ログインエラー:", error);
      setErrorMessage(
        "ログインに失敗しました。メールアドレスとパスワードを確認してください。"
      );
    } finally {
      setIsLoading(false);
    }
  };
  //#endregion

  //#region ゲストアカウント作成処理
  const handleAnonymousLogin = async () => {
    try {
      setIsLoading(true);
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      // ユーザー名をセット（Firebase上のdisplayName）
      if (username.trim() !== "") {
        await updateProfile(user, { displayName: username });
      }
      // Firestore 上にもプロフィールを作成
      await createUserProfile();
      setErrorMessage(null);
      // ここで次のステップへ
      setActiveStep((prev) => prev + 1);
    } catch (error: any) {
      console.error("ゲストアカウント作成エラー:", error);
      setErrorMessage("ゲストアカウント作成中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };
  //#endregion

  //#region ステップごとの表示内容
  const renderStepContent = (step: number) => {
    // step=0: 「ようこそ」 + ログイン or ゲストアカウント作成
    // step=1: isLoginMode が true ならログイン画面、false ならユーザー名入力
    // step=2: 開始画面
    switch (step) {
      case 0:
        return (
          <Box textAlign="center" mt={4}>
            <Typography variant="h5" gutterBottom>
              ようこそ、チューリングゲームへ！
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              ログイン、またはアカウントを作成してください。
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setIsLoginMode(true);
                  setErrorMessage(null);
                  setActiveStep((prev) => prev + 1);
                }}
              >
                ログイン
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setIsLoginMode(false);
                  setErrorMessage(null);
                  setActiveStep((prev) => prev + 1);
                }}
              >
                アカウント作成
              </Button>
            </Box>
          </Box>
        );
      case 1:
        if (isLoginMode) {
          // ログイン用フォーム
          return (
            <Box mt={4}>
              <Typography variant="h6" gutterBottom align="center">
                ログイン
              </Typography>
              {errorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorMessage}
                </Alert>
              )}
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                sx={{ mb: 4 }}
              />
              <Box display="flex" justifyContent="center">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleLogin}
                  disabled={isLoading}
                  sx={{ width: "50%" }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "ログイン"
                  )}
                </Button>
              </Box>
            </Box>
          );
        } else {
          // ゲストアカウント作成用フォーム（ユーザーネームのみ）
          return (
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                ユーザーネームを入力してください
              </Typography>
              {errorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorMessage}
                </Alert>
              )}
              <TextField
                fullWidth
                label="ユーザーネーム（後で変更可能）"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
                sx={{ mb: 4 }}
              />
              <Box display="flex" justifyContent="center">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAnonymousLogin}
                  disabled={isLoading || username.trim() === ""}
                  sx={{ width: "50%" }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "作成"
                  )}
                </Button>
              </Box>
            </Box>
          );
        }
      case 2:
        return (
          <Box mt={4} textAlign="center">
            <Typography variant="h5" gutterBottom>
              準備完了！
            </Typography>
            <Typography variant="body1">
              それではゲームを開始します。
            </Typography>
            <CheckIcon color="success" sx={{ mt: 3 }} fontSize="large" />
            <Box mt={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/")}
              >
                ゲーム開始
              </Button>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };
  //#endregion

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Typography variant="h4" align="center" gutterBottom>
            チューリングゲーム
          </Typography>

          {/* ステッパー表示（3ステップ） */}
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{ mt: 4, mb: 4 }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* 各ステップのコンテンツを表示 */}
          {renderStepContent(activeStep)}
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default Auth;
