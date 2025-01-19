// frontend/src/views/ResultView.tsx

import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ResultData } from "../shared/types.ts";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Paper,
  Grid,
  Divider,
  Card,
  CardContent,
  Fade,
  Avatar,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { appPaths } from "../App.tsx";
import { updateRating } from "../API/firestore-database_f.ts";
import { auth } from "../API/firebase_f.ts";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

export interface ResultViewProps {
  resultData: ResultData;
}

const ResultView: React.FC = () => {
  //#region init
  const location = useLocation();
  const { resultData } = location.state as ResultViewProps;
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    const myId = user ? user.uid : null;
    if (resultData && myId) {
      updateRating(myId, resultData.score * 2);
    }
    // eslint-disable-next-line
  }, [resultData]);

  const toHomeSegue = () => {
    navigate(appPaths.HomeView);
  };

  // 勝敗によってアイコン・背景色を切り替え
  let resultColor = "#f5f5f5";
  let resultMessage = "引き分け";
  let ResultIcon = HorizontalRuleIcon;

  if (resultData.win === "win") {
    resultColor = "#c8e6c9";
    resultMessage = "勝ち！";
    ResultIcon = EmojiEventsIcon;
  } else if (resultData.win === "lose") {
    resultColor = "#ffcdd2";
    resultMessage = "負け...";
    ResultIcon = SentimentDissatisfiedIcon;
  }

  // 正解・不正解の文字色を返す
  const getCorrectTextColor = (isCorrect: boolean): string => {
    return isCorrect ? theme.palette.success.main : theme.palette.error.main;
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: "center" }}>
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            ゲーム結果
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md">
        <Fade in={true} timeout={600}>
          <Box mt={4}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: "center",
                backgroundColor: resultColor,
                borderRadius: 2,
              }}
            >
              {/* 勝敗アイコン */}
              <Typography variant="h4" gutterBottom>
                結果
              </Typography>
              <Box display="flex" justifyContent="center" mb={2}>
                {/* <Avatar sx={{ bgcolor: "transparent", width: 64, height: 64 }}>
                  <ResultIcon
                    sx={{
                      fontSize: 48,
                      color:
                        resultData.win === "win"
                          ? "success.main"
                          : resultData.win === "lose"
                            ? "error.main"
                            : "text.primary",
                    }}
                  />
                </Avatar> */}
              </Box>
              <Box display="flex" justifyContent="center" mb={2}>
                <ResultIcon sx={{ fontSize: 36, mr: 1, mt: 0.7 }} />
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  {resultMessage}
                </Typography>
              </Box>

              <Typography variant="h6">
                獲得スコア: {resultData.score}
              </Typography>
            </Paper>

            <Grid container spacing={4} sx={{ mt: 4 }}>
              {/* あなた */}
              <Grid item xs={12} md={6}>
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #ccc",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      あなた
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>正体:</strong>{" "}
                      {resultData.myAnswer.isHuman ? "人間" : "AI"}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>相手の予想:</strong>{" "}
                      {resultData.opponentAnswer.select ? "人間" : "AI"}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>理由:</strong>{" "}
                      {resultData.opponentAnswer.message || "なし"}
                    </Typography>

                    {/* 判定ラベルは黒文字 */}
                    <Box display="flex" alignItems="center" sx={{ mt: 2 }}>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: "bold", mr: 1 }}
                      >
                        判定:
                      </Typography>
                      {/* 正解/不正解の文字色のみ変更 */}
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: "bold",
                          color: getCorrectTextColor(!resultData.myCorrects),
                        }}
                      >
                        {resultData.myCorrects ? "正解" : "不正解"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 相手 */}
              <Grid item xs={12} md={6}>
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #ccc",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      相手
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>正体:</strong>{" "}
                      {resultData.opponentAnswer.isHuman ? "人間" : "AI"}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>あなたの予想:</strong>{" "}
                      {resultData.myAnswer.select ? "人間" : "AI"}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>理由:</strong>{" "}
                      {resultData.myAnswer.message || "なし"}
                    </Typography>

                    {/* 判定ラベルは黒文字 */}
                    <Box display="flex" alignItems="center" sx={{ mt: 2 }}>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: "bold", mr: 1 }}
                      >
                        判定:
                      </Typography>
                      {/* 正解/不正解の文字色のみ変更 */}
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: "bold",
                          color: getCorrectTextColor(
                            !!resultData.opponentCorrects
                          ),
                        }}
                      >
                        {resultData.opponentCorrects ? "正解" : "不正解"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* ボタンエリア */}
            <Box mt={4} textAlign="center">
              <Button
                variant="contained"
                size="large"
                onClick={toHomeSegue}
                sx={{
                  fontWeight: "bold",
                  backgroundColor:
                    resultData.win === "win"
                      ? "success.main"
                      : resultData.win === "lose"
                        ? "error.main"
                        : "info.main",
                  color: "#fff",
                  "&:hover": {
                    backgroundColor:
                      resultData.win === "win"
                        ? "success.dark"
                        : resultData.win === "lose"
                          ? "error.dark"
                          : "info.dark",
                  },
                }}
              >
                バトル終了
              </Button>
            </Box>
          </Box>
        </Fade>
      </Container>
    </ThemeProvider>
  );
};

export default ResultView;
