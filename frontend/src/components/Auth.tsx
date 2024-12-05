// frontend/src/components/Auth.tsx
import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  fetchSignInMethodsForEmail,
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
  Link,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

const Auth: React.FC = () => {
  //#region 状態管理
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  //#endregion

  //#region メールアドレスの有効性確認
  const checkEmailValidity = async (email: string) => {
    if (!email) {
      setIsEmailValid(false);
      setErrorMessage(null);
      return;
    }
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        setIsEmailValid(false);
        setErrorMessage("登録済みのメールアドレスです。");
      } else {
        setIsEmailValid(true);
        setErrorMessage(null);
      }
    } catch (error) {
      setIsEmailValid(false);
      setErrorMessage("メールアドレスが無効です。");
    }
  };

  useEffect(() => {
    if (isRegister) {
      checkEmailValidity(email);
    }
  }, [email, isRegister]);
  //#endregion

  //#region 認証処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage("パスワードは6文字以上である必要があります。");
      return;
    }

    if (isRegister && username.trim() === "") {
      setErrorMessage("ユーザーネームを入力してください。");
      return;
    }

    try {
      setIsLoading(true);
      if (isRegister) {
        // サインアップ処理
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        await updateProfile(user, { displayName: username });
        await createUserProfile(); // Firestoreでユーザープロファイル作成
        alert("ユーザーが登録され、プロフィールが作成されました。");
        navigate("/");
      } else {
        // ログイン処理
        await signInWithEmailAndPassword(auth, email, password);
        alert("ログインに成功しました。");
        navigate("/");
      }
    } catch (error: any) {
      console.error("認証エラー:", error);

      // Firebaseのエラーメッセージに基づいてエラーを設定
      switch (error.code) {
        case "auth/invalid-email":
          setErrorMessage("無効なメールアドレスです。");
          break;
        case "auth/user-disabled":
          setErrorMessage("このユーザーアカウントは無効化されています。");
          break;
        case "auth/user-not-found":
          setErrorMessage(
            "ユーザーが見つかりません。アカウントを作成してください。"
          );
          break;
        case "auth/wrong-password":
          setErrorMessage("パスワードが正しくありません。");
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

  //#region ゲストログイン
  const handleAnonymousLogin = async () => {
    try {
      setIsLoading(true);
      await signInAnonymously(auth);
      alert("ゲストで続行します。");
      navigate("/");
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

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xs">
        <Box mt={8} display="flex" flexDirection="column" alignItems="center">
          <Typography component="h1" variant="h5">
            {isRegister ? "サインアップ" : "ログイン"}
          </Typography>
          {errorMessage && (
            <Alert severity="error" sx={{ mt: 2, width: "100%" }}>
              {errorMessage}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {isRegister && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="ユーザーネーム"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={isRegister && !isEmailValid && email !== ""}
              helperText={
                isRegister && !isEmailValid && email !== ""
                  ? "有効なメールアドレスを入力してください。"
                  : ""
              }
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isLoading || (isRegister && !isEmailValid)}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isRegister ? (
                "登録"
              ) : (
                "ログイン"
              )}
            </Button>
            <Box textAlign="center">
              <Link
                href="#"
                variant="body2"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMessage(null);
                }}
              >
                {isRegister
                  ? "既にアカウントをお持ちですか？ ログイン"
                  : "アカウントを作成"}
              </Link>
            </Box>
          </Box>
          <Box mt={4} textAlign="center">
            <Typography variant="body1">または</Typography>
            <Button
              variant="outlined"
              onClick={handleAnonymousLogin}
              disabled={isLoading}
              sx={{ mt: 2 }}
            >
              ゲストのままプレイ
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Auth;
