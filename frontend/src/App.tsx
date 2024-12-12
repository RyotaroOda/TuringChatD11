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
import HowToPlay from "./components/HowToPlay.tsx";
import IconGenerator from "./components/IconGenerator.tsx";
import SingleBattleView from "./views/SingleBattleView.tsx";

export const variables = {
  experiment: true,
  backend: false,
  defaultPrompt: "未設定",
  disableClientGeneration: true, // - フロントエンドでの画像生成を無効化
  targetAge: "小学校高学年", // - 対象年齢: ${variables.targetAge} 向けのメッセージを生成してください。
  maxToken: 300,
};

//

export const appPaths = {
  HomeView: "/",
  RoomView: (roomId: string) => `/room/${roomId}`,
  BattleRoomView: (battleId: string) => `/battle/${battleId}`,
  BattleView: (battleId: string) => `/battle/${battleId}/battle`,
  ResultView: (battleId: string) => `/battle/${battleId}/result`,
  SingleBattleView: "/single_battle",
  login: "/login",
  profile: "/profile",
  profile_edit: "/profile_edit",
  prompt_edit: "/prompt_edit",
  questionnaire_edit: "/questionnaire_edit",
  impression_edit: "/impression_edit",
  how_to_play: "/how_to_play",
  icon_generator: "/icon_generator",
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
              path={appPaths.RoomView("/room/:roomId")}
              element={
                <ProtectedRoute>
                  <RoomView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/battle/:battleRoomId"
              element={
                <ProtectedRoute>
                  <BattleRoomView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/battle/:battleRoomId/battle"
              element={
                <ProtectedRoute>
                  <BattleView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/battle/:battleRoomId/result"
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
            <Route
              path="/icon_generator"
              element={
                <ProtectedRoute>
                  <IconGenerator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/single_battle"
              element={
                <ProtectedRoute>
                  <SingleBattleView />
                </ProtectedRoute>
              }
            />
            <Route path="/profile_edit" element={<ProfileEdit />} />{" "}
            <Route path="/questionnaire_edit" element={<QuestionnaireEdit />} />{" "}
            <Route path="/impression_edit" element={<ImpressionEdit />} />{" "}
            <Route path="/prompt_edit" element={<PromptEdit />} />{" "}
            <Route path="/how_to_play" element={<HowToPlay />} />{" "}
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
