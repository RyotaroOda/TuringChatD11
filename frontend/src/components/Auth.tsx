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
import { createUserProfile } from "../services/profileAPI.ts";

const Auth: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false); // サインアップかログインかの状態
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // エラーメッセージ
  const [isEmailValid, setIsEmailValid] = useState(false); // メールアドレスの有効性
  const navigate = useNavigate(); // navigateフックの使用
  const [isPushSignup, setIsPushSignup] = useState(false);
  const [isPushLogin, setIsPushLogin] = useState(false);

  // メールアドレスの有効性を確認する関数
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

  // メールアドレスとパスワードでのログイン・サインアップ処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // パスワードが6文字以上であることを確認する
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
        // サインアップ
        setIsPushSignup(true);
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        await updateProfile(user, { displayName: username }); // FirebaseAuthで名前を更新
        // プロフィール作成
        await createUserProfile();
        alert("ユーザーが登録され、プロフィールが作成されました");

        // ? to profile edit page
        navigate("/");
      } else {
        // ログイン
        setIsPushLogin(true);
        await signInWithEmailAndPassword(auth, email, password);
        alert("ログインに成功しました");
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("エラーが発生しました: " + error.message);
    }
  };

  // 匿名ログイン処理
  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
      alert("ゲストでログインしました");
      navigate("/"); // ログイン後にホーム画面にリダイレクト
    } catch (error) {
      console.error("ゲストログインエラー:", error);
      setErrorMessage("ゲストログイン中にエラーが発生しました");
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
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}{" "}
      {/* エラーメッセージの表示 */}
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
