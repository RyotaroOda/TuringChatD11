// frontend/src/views/SingleBattleView.tsx

import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { BotSetting, GPTMessage } from "../shared/types";
import { generateSingleMessage, AIJudgement } from "../API/chatGPT_f.ts";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

export type Difficulty = "初級" | "中級" | "上級";

export interface SingleBattleViewProps {
  difficulty: Difficulty;
  isHuman: boolean;
  bot: BotSetting | null;
}

const SingleBattleView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [bot, setBot] = useState<BotSetting | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("初級");
  const [isHuman, setIsHuman] = useState<boolean>(true);
  const [messages, setMessages] = useState<GPTMessage[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [maxTurns, setMaxTurns] = useState<number>(5); // n回のチャット
  const [sendMessage, setSendMessage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [judgmentMade, setJudgmentMade] = useState<boolean>(false);
  const [judgmentReason, setJudgmentReason] = useState<string>("");

  useEffect(() => {
    if (location.state) {
      const { bot, difficulty, isHuman } =
        location.state as SingleBattleViewProps;
      setBot(bot);
      setDifficulty(difficulty);
      setIsHuman(isHuman);
    } else {
      console.error("No state passed to SingleBattleView");
    }
  }, [location.state]);

  useEffect(() => {
    if (difficulty) {
      switch (difficulty) {
        case "初級":
          setMaxTurns(5);
          break;
        case "中級":
          setMaxTurns(10);
          break;
        case "上級":
          setMaxTurns(15);
          break;
        default:
          setMaxTurns(5);
          break;
      }
    } else {
      setMaxTurns(5);
    }
  }, [difficulty]);

  const handleSendMessage = async () => {
    if (isGenerating) return;

    if (isHuman) {
      if (sendMessage.trim() === "") return;

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "user",
          content: sendMessage,
        },
      ]);
      setSendMessage("");
    } else {
      // プレイヤーのボットがメッセージを生成
      setIsGenerating(true);
      if (bot) {
        if (bot) {
          const playerBotMessage = await generateSingleMessage(
            bot,
            messages,
            difficulty
          );
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              role: "user",
              content: playerBotMessage,
            },
          ]);
        }
      }
      setIsGenerating(false);
    }

    setCurrentTurn((prevTurn) => prevTurn + 1);

    if (currentTurn + 1 >= maxTurns * 2) {
      if (bot) {
        const aiResponse = await generateSingleMessage(
          bot,
          messages,
          difficulty
        );
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: aiResponse,
          },
        ]);
      }
    }
  };

  const generateAIResponse = async () => {
    setIsGenerating(true);
    if (bot) {
      const aiResponse = await generateSingleMessage(bot, messages, difficulty);
      setIsGenerating(false);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: aiResponse,
        },
      ]);
    }

    setCurrentTurn((prevTurn) => prevTurn + 1);

    if (currentTurn + 1 >= maxTurns * 2) {
      await makeAIJudgment();
      return;
    }
  };

  const makeAIJudgment = async () => {
    setIsGenerating(true);
    const judgment = await AIJudgement(messages, difficulty);
    setIsGenerating(false);
    setJudgmentMade(true);

    const aiThinksHuman = judgment?.isHuman;
    const actualIsHuman = isHuman;

    setJudgmentReason(judgment?.reason || "");

    const isAIWin =
      (aiThinksHuman && !actualIsHuman) || (!aiThinksHuman && actualIsHuman);

    const battleResult = isAIWin ? "You lose" : "You win";
    setResult(battleResult);

    console.log(battleResult);
    console.log("props", { bot, level: difficulty, isHuman });
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              textAlign: "center",
            }}
          >
            シングルバトル
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box mt={4}>
          {/* チャットログ */}
          <Paper
            elevation={3}
            sx={{ maxHeight: 300, overflowY: "auto", p: 2, mb: 2 }}
          >
            <List>
              {messages.map((msg, index) => (
                <ListItem
                  key={index}
                  sx={{
                    justifyContent:
                      msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: "70%",
                      bgcolor:
                        msg.role === "user" ? "primary.main" : "grey.300",
                      color: msg.role === "user" ? "white" : "black",
                      borderRadius: 2,
                      p: 1,
                    }}
                  >
                    <ListItemText
                      primary={msg.content}
                      secondary={msg.role === "user" ? "あなた" : "AI"}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* メッセージ入力 */}
          {!judgmentMade && (
            <>
              <TextField
                label="メッセージを入力"
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                fullWidth
                disabled={isGenerating}
                sx={{
                  backgroundColor: "white",
                  mb: 2,
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendMessage}
                disabled={isGenerating}
                fullWidth
                sx={{ mt: 2 }}
              >
                {isGenerating ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "送信"
                )}
              </Button>
              <Typography variant="body1" sx={{ mt: 2 }}>
                残りターン数:{" "}
                {maxTurns * 2 - currentTurn > 0
                  ? maxTurns * 2 - currentTurn
                  : 0}
              </Typography>
            </>
          )}

          {/* 結果表示 */}
          {judgmentMade && (
            <Box mt={4}>
              <Typography variant="h4" gutterBottom>
                {result}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/")}
              >
                ホームに戻る
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default SingleBattleView;
