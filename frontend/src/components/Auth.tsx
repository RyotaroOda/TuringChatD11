//frontend/src/components/Auth.tsx
import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "../services/firebase_f.ts";
import { useNavigate } from "react-router-dom";
import { createUserProfile } from "../services/firestore-database_f.ts";

const Auth: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const navigate = useNavigate();
  const [isPushSignup, setIsPushSignup] = useState(false);
  const [isPushLogin, setIsPushLogin] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setErrorMessage("パスワードは6文字以上である必要があります");
      return;
    }

    if (isRegister && username.trim() === "") {
      setErrorMessage("ユーザーネームを入力してください");
      return;
    }

    try {
      if (isRegister && username.trim() !== "") {
        setIsPushSignup(true);
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        await updateProfile(user, { displayName: username });
        await createUserProfile();
        alert("ユーザーが登録され、プロフィールが作成されました");
        navigate("/");
      } else {
        setIsPushLogin(true);
        await signInWithEmailAndPassword(auth, email, password);
        alert("ログインに成功しました");
        navigate("/");
      }
    } catch (error: any) {
      console.error("認証エラー:", error);

      // Firebase Authenticationのエラーコードに基づいたエラーメッセージを設定
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
      setIsPushSignup(false);
      setIsPushLogin(false);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
      alert("ゲストでログインしました");
      navigate("/");
    } catch (error: any) {
      console.error("ゲストログインエラー:", error);
      setErrorMessage(
        "ゲストログイン中にエラーが発生しました。もう一度お試しください。"
      );
    }
  };

  if (isPushLogin) {
    return <p>ログイン中...</p>;
  }
  if (isPushSignup) {
    return <p>登録中...</p>;
  }

  return (
    <div>
      <h1>{isRegister ? "サインアップ" : "ログイン"}</h1>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        {isRegister && (
          <input
            type="text"
            placeholder="ユーザーネーム(変更可）"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p>
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </p>
        <button type="submit" disabled={isRegister && !isEmailValid}>
          {isRegister ? "登録" : "ログイン"}
        </button>
      </form>
      <h3>または</h3>
      <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister
          ? "既にアカウントをお持ちですか？ログイン"
          : "アカウントを作成"}
      </button>
      <div style={{ marginTop: "20px" }}>
        <h3>または</h3>
        <button onClick={handleAnonymousLogin}>ゲストのままプレイ</button>
      </div>
    </div>
  );
};

export default Auth;
