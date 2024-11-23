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
import BattleRoomView from "./views/BattleRoomView.tsx";
import Auth from "./components/Auth.tsx";
import Profile from "./components/Profile.tsx"; // 任意のプロフィールページ
import ProtectedRoute from "./components/ProtectedRoute.tsx"; // 認証保護されたルート
import { AuthProvider } from "./components/AuthProvider.tsx"; // 認証状態のコンテキスト
import ProfileEdit from "./components/ProfileEdit.tsx";
import PromptEdit from "./components/PromptEdit.tsx";
import QuestionnaireEdit from "./components/QuestionnaireEdit.tsx";
import ImpressionEdit from "./components/ImpressionEdit.tsx";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material/styles";
import RoomView from "./views/PrivateRoomView.tsx";
import { BattleRoomIds } from "./shared/database-paths.ts";

export const appPaths = {
  HomeView: "/",
  RoomView: (roomId: string) => `/${roomId}`,
  BattleRoomView: (ids: BattleRoomIds) => `/${ids.roomId}/${ids.battleRoomId}`,
  BattleView: (ids: BattleRoomIds) =>
    `/${ids.roomId}/${ids.battleRoomId}/battle`,
  ResultView: (ids: BattleRoomIds) =>
    `/${ids.roomId}/${ids.battleRoomId}/result`,
  battleRoom: "/battleRoom",
  login: "/login",
  profile: "/profile",
  profile_edit: "/profile_edit",
  prompt_edit: "/prompt_edit",
  questionnaire_edit: "/questionnaire_edit",
  impression_edit: "/impression_edit",
};

// カスタムテーマの作成
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // 深いブルー
    },
    secondary: {
      main: "#ff4081", // 明るいピンク
    },
    background: {
      default: "#f5f5f5", // 優しいグレー
      paper: "#ffffff", // カードやモーダルの背景
    },
    text: {
      primary: "#333333", // 主要なテキスト
      secondary: "#757575", // 補足的なテキスト
    },
  },
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
    h4: {
      fontWeight: 700, // 見出しを太字に
    },
    body1: {
      lineHeight: 1.6, // 読みやすさのための行間
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // ボタンの角を少し丸める
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        {/* 認証状態をアプリ全体に提供 */}
        <Router>
          <Routes>
            <Route path="/" element={<HomeView />} />
            {/* 認証が必要なルート */}
            <Route
              path={appPaths.RoomView(":roomId")}
              element={
                <ProtectedRoute>
                  <RoomView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:roomId/:battleRoomId"
              element={
                <ProtectedRoute>
                  <BattleRoomView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:roomId/:battleRoomId/battle"
              element={
                <ProtectedRoute>
                  <BattleView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:roomId/:battleRoomId/result"
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
            <Route path="/questionnaire_edit" element={<QuestionnaireEdit />} />{" "}
            <Route path="/impression_edit" element={<ImpressionEdit />} />{" "}
            <Route path="/prompt_edit" element={<PromptEdit />} />{" "}
            {/* 認証済みでない場合のリダイレクト */}
            <Route
              path="*"
              element={<Navigate to={appPaths.HomeView} />}
            />{" "}
            {/* その他のパスはホームにリダイレクト */}
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
