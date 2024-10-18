import React, { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase_f.ts";  // Firebase Authインスタンスをインポート

// 認証コンテキストの作成
const AuthContext = createContext<{ user: User | null }>({ user: null });

// 認証状態を提供するプロバイダーコンポーネント
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);  // ログインしているユーザー情報をセット
      setLoading(false);
    });

    // クリーンアップ
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

// カスタムフック useAuth の実装
export const useAuth = () => {
  return useContext(AuthContext);  // コンテキストから認証情報を取得
};
