import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
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
  Link,
  Card,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";

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
  const steps = ["ようこそ", "名前設定", "アドレス登録", "開始"];

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(false); // ログイン画面フラグ

  const navigate = useNavigate();
  //#endregion

  //#region ユーザー作成処理
  const handleSignup = async () => {};

  const handleLogin = async () => {
    await signInWithEmailAndPassword(auth, email, password);
    alert("ログインに成功しました。");
    navigate("/");
  };

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

  const handleAnonymousLogin = async () => {
    try {
      setIsLoading(true);
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      await updateProfile(user, { displayName: username });
      await createUserProfile();
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

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box textAlign="center" mt={4}>
            <Typography variant="h5" gutterBottom>
              ようこそ、チューリングゲームへ！
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              チューリングテストをテーマにした新感覚ゲームへようこそ！
            </Typography>
            <Card sx={{ p: 2, mb: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                すでにアカウントをお持ちの方は
              </Typography>
              <Button
                component="button"
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setIsLoginMode(true);
                  setErrorMessage(null);
                }}
              >
                ログイン
              </Button>
            </Card>
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
              メールアドレス登録
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
            <CheckIcon color="success" sx={{ mt: 3 }} fontSize="large" />
          </Box>
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    setErrorMessage(null);

    if (activeStep === 3) {
      // 最終ステップ「ゲーム開始」押下でトップへ
      navigate("/");
    } else {
      // 次のステップへ
      setActiveStep((prev) => prev + 1);
    }
  };

  //#region ログイン処理
  const renderLogin = () => (
    <Box mt={4}>
      <Typography variant="h5" gutterBottom align="center">
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
      <Box textAlign="center" mt={4}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          新規登録はこちら
        </Typography>
        <Link
          component="button"
          variant="body2"
          underline="hover"
          onClick={() => {
            setIsLoginMode(false);
            setErrorMessage(null);
            // 新規登録へ戻るとき、念のためステップをリセットしてもよいが、ここではそのまま冒頭ステップへ戻す場合:
            setActiveStep(0);
          }}
        >
          サインアップページへ戻る
        </Link>
      </Box>
    </Box>
  );
  //#endregion

  //#region サインアップ処理
  const renderSignupFlow = () => (
    <>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 4, mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      <Box display="flex" justifyContent="center" mt={6}>
        {activeStep === 0 && (
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
              "アカウント作成"
            )}
          </Button>
        )}

        {activeStep === 1 && (
          // ユーザーネームが空白のみ、または空であれば無効化
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={isLoading || username.trim() === ""}
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
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRegister}
              disabled={isLoading}
              sx={{ width: "40%", mr: 2 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "次へ"
              )}
            </Button>
            <Button
              variant="outlined"
              onClick={handleAnonymousLogin}
              disabled={isLoading}
              sx={{ width: "40%" }}
            >
              スキップ
            </Button>
          </>
        )}

        {activeStep === 3 && (
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
    </>
  );

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Typography variant="h4" align="center" gutterBottom>
            チューリングゲーム
          </Typography>

          {!isLoginMode && errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {isLoginMode ? renderLogin() : renderSignupFlow()}
        </Paper>
      </Container>
    </ThemeProvider>
  );
};
export default Auth;
