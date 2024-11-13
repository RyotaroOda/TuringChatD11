//frontend/src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import HomeView from "./views/HomeView.tsx";
import BattleView from "./views/BattleView.tsx";
import ResultView from "./views/ResultView.tsx";
import RoomView from "./views/RoomView.tsx";
import Auth from "./components/Auth.tsx";
import Profile from "./components/Profile.tsx"; // 任意のプロフィールページ
import ProtectedRoute from "./components/ProtectedRoute.tsx"; // 認証保護されたルート
import { AuthProvider } from "./components/AuthProvider.tsx"; // 認証状態のコンテキスト
import ProfileEdit from "./components/ProfileEdit.tsx";
import PromptEdit from "./components/PromptEdit.tsx";

function App() {
  return (
    <AuthProvider>
      {" "}
      {/* 認証状態をアプリ全体に提供 */}
      <Router>
        <Routes>
          <Route path="/" element={<HomeView />} />
          {/* 認証が必要なルート */}
          <Route
            path="/:roomId"
            element={
              <ProtectedRoute>
                <RoomView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:roomId/battle"
            element={
              <ProtectedRoute>
                <BattleView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:roomId/battle/result"
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
          <Route path="/profile_edit" element={<ProfileEdit />} />{" "}
          <Route path="/prompt_edit" element={<PromptEdit />} />{" "}
          {/* <Route path="/questionnaire_edit" element={< />} />{" "} */}
          {/* 認証済みでない場合のリダイレクト */}
          <Route path="*" element={<Navigate to="/" />} />{" "}
          {/* その他のパスはホームにリダイレクト */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
