// frontend/src/views/ResultView.tsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ResultData } from "../shared/types";
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
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { appPaths } from "../App.tsx";

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

  const toHomeSegue = () => {
    navigate(appPaths.HomeView);
  };

  const toBattleRoomSegue = () => {
    //戻る
  };
  //#endregion

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            ゲーム結果
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box mt={4}>
          <Paper elevation={3} sx={{ padding: 4, textAlign: "center" }}>
            <Typography variant="h4" gutterBottom>
              ゲーム結果
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color:
                  resultData.win === "win"
                    ? "success.main"
                    : resultData.win === "lose"
                      ? "error.main"
                      : "info.main",
              }}
            >
              {resultData.win === "win"
                ? "勝ち！"
                : resultData.win === "lose"
                  ? "負け..."
                  : "引き分け"}
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              <strong>バトルスコア:</strong> {resultData.score}
            </Typography>
            {/* <Typography variant="body1">
              <strong>バトル時間:</strong> {resultData.time} ms
            </Typography> */}
          </Paper>

          <Grid container spacing={4} sx={{ mt: 4 }}>
            {/* 自分の結果 */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    自分の回答
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1">
                    <strong>Identity:</strong>{" "}
                    {resultData.myAnswer.isHuman ? "人間" : "AI"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Selection:</strong>{" "}
                    {resultData.myAnswer.select ? "人間" : "AI"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>理由:</strong>{" "}
                    {resultData.myAnswer.message || "No message"}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    <strong>判定:</strong>{" "}
                    {resultData.myCorrects ? "正解" : "不正解"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* 相手の結果 */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    相手の回答
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1">
                    <strong>Identity:</strong>{" "}
                    {resultData.opponentAnswer.isHuman ? "人間" : "AI"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Selection:</strong>{" "}
                    {resultData.opponentAnswer.select ? "人間" : "AI"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>理由:</strong>{" "}
                    {resultData.opponentAnswer.message || "No message"}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    <strong>判定:</strong>{" "}
                    {resultData.opponentCorrects ? "正解" : "不正解"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ボタンエリア */}
          <Box mt={4} textAlign="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={toHomeSegue}
            >
              バトル終了
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default ResultView;
