// src/components/Profile.tsx
import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../API/firebase_f.ts";

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // クリーンアップ
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("ログアウトしました");
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  return (
    <div>
      {user ? (
        <div>
          <h1>こんにちは、{user.email}さん</h1>
          <button onClick={handleLogout}>ログアウト</button>
        </div>
      ) : (
        <h1>ログインしていません</h1>
      )}
    </div>
  );
};

export default Profile;
