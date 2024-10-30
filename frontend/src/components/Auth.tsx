// frontend/src/components/Auth.tsx
import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
} from "firebase/auth";
import { auth } from "../services/firebase_f.ts";
import { useNavigate } from "react-router-dom";
import { createUserProfile } from "../services/player-profile.ts";

const Auth: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [isRegister, setIsRegister] = useState(false); // サインアップかログインかの状態
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // エラーメッセージ
  const navigate = useNavigate(); // navigateフックの使用

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
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        await updateProfile(user, { displayName: username }); // FirebaseAuthで名前を更新
        // プロフィール作成
        await createUserProfile(user);
        alert("ユーザーが登録され、プロフィールが作成されました");

        // プロフィール編集画面へ遷移
        navigate("/profile_edit");
      } else {
        // ログイン
        await signInWithEmailAndPassword(auth, email, password);
        alert("ログインに成功しました");
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
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{isRegister ? "登録" : "ログイン"}</button>
      </form>
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
