// src/components/Auth.tsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase.ts";

const Auth: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false); // サインアップかログインかの状態

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        // サインアップ
        await createUserWithEmailAndPassword(auth, email, password);
        alert("ユーザーが登録されました");
      } else {
        // ログイン
        await signInWithEmailAndPassword(auth, email, password);
        alert("ログインに成功しました");
      }
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました: " + error.message);
    }
  };

  return (
    <div>
      <h1>{isRegister ? "サインアップ" : "ログイン"}</h1>
      <form onSubmit={handleSubmit}>
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
        {isRegister ? "既にアカウントをお持ちですか？ログイン" : "アカウントを作成"}
      </button>
    </div>
  );
};

export default Auth;
