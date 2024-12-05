//frontend/src/components/ImpressionEdit.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addUserImpression } from "../API/firestore-database_f.ts";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  CssBaseline,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

const ImpressionEdit: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message) {
      await addUserImpression(message);
      alert("送信しました。");
      navigate(-1);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Button
            variant="outlined" // ボタンのスタイルをテキストベースに
            color="inherit"
            startIcon={<ArrowBackIcon />} // 矢印アイコンを追加
            sx={{
              textTransform: "none", // テキストをそのままの形で表示（全大文字を防ぐ）
              borderColor: "#ffffff", // ボーダーカラーを白に設定
              color: "#ffffff", // テキストカラーを白
              ":hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)", // ホバー時の背景色
              },
            }}
            onClick={() => navigate("/")}
          >
            戻る
          </Button>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              textAlign: "center",
              whiteSpace: "nowrap", // テキストの折り返しを防止
              overflow: "hidden", // 必要に応じてあふれたテキストを隠す
              textOverflow: "ellipsis", // 必要に応じて省略記号を表示
            }}
          >
            フィードバック
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ padding: 4, mt: 4 }}>
          <Typography variant="h4" gutterBottom textAlign="center">
            フィードバック
          </Typography>
          <Typography variant="body1" gutterBottom textAlign="center">
            ご意見や感想を教えてください
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box mt={2}>
              <TextField
                label="メッセージ"
                multiline
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Box>
            <Box mt={3} textAlign="center">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ textTransform: "none", fontSize: "1rem" }}
              >
                送信
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default ImpressionEdit;
