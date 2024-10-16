import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomeView from "./views/HomeView.tsx";
import BattleView from "./views/BattleView.tsx";
import ResultView from "./views/ResultView.tsx";
import Auth from "./components/Auth.tsx";
import Profile from "./components/Profile.tsx";  // 任意のプロフィールページ
import ProtectedRoute from "./components/ProtectedRoute.tsx";  // 認証保護されたルート
import { AuthProvider } from "./services/useAuth.tsx";  // 認証状態のコンテキスト

function App() {
  return (
    <AuthProvider> {/* 認証状態をアプリ全体に提供 */}
      <Router>
        <Routes>
          <Route path="/" element={<HomeView />} />

          {/* 認証が必要なルート */}
          <Route
            path="/battle/:roomId"
            element={
              <ProtectedRoute>
                <BattleView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/result"
            element={
              <ProtectedRoute>
                <ResultView />
              </ProtectedRoute>
            }
          />

          {/* 認証ページ */}
          <Route path="/login" element={<Auth />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
