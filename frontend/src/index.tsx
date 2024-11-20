import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import reportWebVitals from "./reportWebVitals.ts";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";

// ルート要素の取得
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "ルート要素が見つかりません。HTMLに <div id='root'></div> を追加してください。"
  );
}

const root = ReactDOM.createRoot(rootElement);

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

// アプリケーションのレンダリング
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// パフォーマンス測定（必要に応じて）
reportWebVitals(console.log); // 必要ならコールバックを渡す
