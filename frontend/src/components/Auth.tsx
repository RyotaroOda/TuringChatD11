import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  signInAnonymously,
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

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  palette: {
    primary: {
      main: "#1976d2",
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

const Auth: React.FC = () => {
  //#region 状態管理
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["ようこそ", "ユーザーネーム", "アドレス登録", "開始"];

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  //#endregion

  //#region ユーザー作成処理
  const handleRegister = async () => {
    if (password.length < 6) {
      setErrorMessage("パスワードは6文字以上である必要があります。");
      return;
    }

    try {
      setIsLoading(true);
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        setErrorMessage("このメールアドレスは既に登録されています。");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: username });
      await createUserProfile();
      setErrorMessage(null);
      // 登録成功で次のステップへ
      setActiveStep((prev) => prev + 1);
    } catch (error: any) {
      console.error("エラー:", error);
      switch (error.code) {
        case "auth/invalid-email":
          setErrorMessage("無効なメールアドレスです。");
          break;
        case "auth/user-disabled":
          setErrorMessage("このユーザーアカウントは無効化されています。");
          break;
        case "auth/email-already-in-use":
          setErrorMessage("このメールアドレスは既に使用されています。");
          break;
        case "auth/weak-password":
          setErrorMessage("パスワードは6文字以上である必要があります。");
          break;
        default:
          setErrorMessage("エラーが発生しました。もう一度お試しください。");
      }
    } finally {
      setIsLoading(false);
    }
  };
  //#endregion

  //#region ゲストログイン処理
  const handleAnonymousLogin = async () => {
    try {
      setIsLoading(true);
      await signInAnonymously(auth);
      setErrorMessage(null);
      // ゲストログイン成功で次のステップへ
      setActiveStep((prev) => prev + 1);
    } catch (error: any) {
      console.error("ゲストログインエラー:", error);
      setErrorMessage(
        "ゲストログイン中にエラーが発生しました。もう一度お試しください。"
      );
    } finally {
      setIsLoading(false);
    }
  };
  //#endregion

  const handleNext = () => {
    setErrorMessage(null);

    // ステップごとのバリデーション
    if (activeStep === 1) {
      // ユーザーネームの必須チェックを外しているので処理なし
    }

    if (activeStep === 0 || activeStep === 1) {
      // 次のステップへ
      setActiveStep((prev) => prev + 1);
    } else if (activeStep === 3) {
      // 最終ステップ「ゲーム開始」押下でトップへ
      navigate("/");
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box textAlign="center" mt={4}>
            <Typography variant="h5" gutterBottom>
              ようこそ、チューリングゲームへ！
            </Typography>
            <Typography variant="body1">
              チューリングテストをテーマにした新感覚ゲームへようこそ！
            </Typography>
          </Box>
        );
      case 1:
        return (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              ユーザーネームを入力して下さい
            </Typography>
            <TextField
              fullWidth
              label="ユーザーネーム（後で変更可能）"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined"
            />
          </Box>
        );
      case 2:
        return (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              メールアドレス登録（任意）
            </Typography>
            <Box mt={2}>
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
                label="パスワード（6文字以上）"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
              />
            </Box>
          </Box>
        );
      case 3:
        return (
          <Box mt={4} textAlign="center">
            <Typography variant="h5" gutterBottom>
              準備完了！
            </Typography>
            <Typography variant="body1">
              それではゲームを開始します。
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
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

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {renderStepContent(activeStep)}

          <Box display="flex" justifyContent="center" mt={6}>
            {/* ステップごとにボタン表示を切り替え */}
            {activeStep < 2 && (
              // ステップ0,1は「次へ」ボタンのみ
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={isLoading}
                sx={{ width: "50%" }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "次へ"
                )}
              </Button>
            )}

            {activeStep === 2 && (
              // ステップ2では「次へ」と「スキップ」ボタンを並べる
              <>
                <Button
                  variant="outlined"
                  onClick={handleAnonymousLogin}
                  disabled={isLoading}
                  sx={{ width: "40%", mr: 2 }}
                >
                  スキップ
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRegister}
                  disabled={isLoading}
                  sx={{ width: "40%" }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "次へ"
                  )}
                </Button>
              </>
            )}

            {activeStep === 3 && (
              // ステップ3は「ゲーム開始」ボタンのみ
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={isLoading}
                sx={{ width: "50%" }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "ゲーム開始"
                )}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default Auth;
