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

// アプリケーションのレンダリング
root.render(
  <React.StrictMode>
    <CssBaseline />
    <App />
  </React.StrictMode>
);

// パフォーマンス測定（必要に応じて）
reportWebVitals(console.log); // 必要ならコールバックを渡す
