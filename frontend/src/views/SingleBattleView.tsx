import React, { useState, useEffect, useRef } from "react";
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
  ListItemAvatar,
  Card,
  CardContent,
  Fade,
} from "@mui/material";
import {
  createTheme,
  ThemeProvider,
  responsiveFontSizes,
} from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { BotSetting, GPTMessage } from "../shared/types.ts";
import {
  generateSingleMessage,
  AIJudgement,
  generateSingleTopic,
  generateTestMessage,
} from "../API/chatGPT_f.ts";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import Avatar from "@mui/material/Avatar";
import { auth } from "../API/firebase_f.ts";
import SendIcon from "@mui/icons-material/Send";
import CreateIcon from "@mui/icons-material/Create";

export type Difficulty = "初級" | "中級" | "上級";

let theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#c2185b",
    },
    success: {
      main: "#388e3c",
    },
    info: {
      main: "#1976d2",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#333",
      secondary: "#555",
    },
  },
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
    h6: {
      fontWeight: "bold",
    },
  },
});
theme = responsiveFontSizes(theme);

export interface SingleBattleViewProps {
  difficulty: Difficulty;
  isHuman: boolean;
  bot: BotSetting | null;
}

const SingleBattleView: React.FC = () => {
  const user = auth.currentUser;
  const location = useLocation();
  const navigate = useNavigate();

  const [bot, setBot] = useState<BotSetting | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("初級");
  const [isHuman, setIsHuman] = useState<boolean>(true);
  const [messages, setMessages] = useState<GPTMessage[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [maxTurn, setMaxTurn] = useState<number>(5);
  const [sendMessage, setSendMessage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAIGenerating, setIsAIGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [judgmentMade, setJudgmentMade] = useState<boolean>(false);
  const [judgmentReason, setJudgmentReason] = useState<string>("");
  const [isJudging, setIsJudging] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [showingResult, setShowingResult] = useState(false);
  const [showGeneratedAnswer, setShowGeneratedAnswer] = useState(true);

  useEffect(() => {
    if (location.state) {
      const { bot, difficulty, isHuman } =
        location.state as SingleBattleViewProps;
      setBot(bot);
      setDifficulty(difficulty);
      setIsHuman(isHuman);
      const initializeMessages = async () => {
        setIsAIGenerating(true);
        const topic = await generateSingleTopic();
        if (messages.length === 0) {
          setMessages([
            {
              role: "system",
              content: topic,
            },
          ]);
        }
        setIsAIGenerating(false);
      };
      if (!isAIGenerating) initializeMessages();
    }
  }, [location.state]);

  useEffect(() => {
    if (difficulty) {
      switch (difficulty) {
        case "初級":
          setMaxTurn(3);
          break;
        case "中級":
          setMaxTurn(5);
          break;
        case "上級":
          setMaxTurn(10);
          break;
        default:
          setMaxTurn(5);
          break;
      }
    } else {
      setMaxTurn(5);
    }
  }, [difficulty]);

  // メッセージ送信処理
  const handleSendMessage = async () => {
    if (isGenerating || sendMessage.trim() === "") return;

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "user",
        content: sendMessage,
      },
    ]);
    setSendMessage("");
    setShowGeneratedAnswer(false);

    if (currentTurn + 1 === maxTurn) {
      makeAIJudgment();
    } else {
      if (bot) {
        setIsAIGenerating(true);
        const aiResponse = await generateTestMessage(messages);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: aiResponse,
          },
        ]);
        setIsAIGenerating(false);
      }
      if (currentTurn + 2 === maxTurn) {
        makeAIJudgment();
      } else {
        if (!isHuman) {
          generateMessage();
        }
      }
      setCurrentTurn((prevTurn) => prevTurn + 1);
    }
    setCurrentTurn((prevTurn) => prevTurn + 1);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateMessage = async () => {
    setIsGenerating(true);
    if (bot) {
      const response = await generateSingleMessage(bot, messages);
      setSendMessage(response);
      setIsGenerating(false);
      setShowGeneratedAnswer(true);
    }
  };

  useEffect(() => {
    if (judgmentReason) {
      console.log("judgmentReason", judgmentReason);
    }
  }, [judgmentReason]);

  // AI判定処理
  const makeAIJudgment = async () => {
    setIsGenerating(true);
    setIsJudging(true);
    const aiJudgmentResponse = await AIJudgement(messages, difficulty);
    if (!aiJudgmentResponse) {
      throw new Error("AIJudgement returned undefined");
    }
    const judgment = JSON.parse(aiJudgmentResponse);
    setIsGenerating(false);

    const aiThinksHuman = judgment?.isHuman;
    const actualIsHuman = isHuman;

    if (judgment) {
      console.log(judgment);
      console.log("judgment.isHuman", judgment["isHuman"]);
      console.log("judgment.reason", judgment.reason);
      setJudgmentReason(judgment.reason);
    }

    const isWin =
      (aiThinksHuman && !actualIsHuman) || (!aiThinksHuman && actualIsHuman);

    const battleResult = isWin ? "勝利！" : "負け";
    setResult(battleResult);

    // 3秒間の判定中演出後に結果を表示
    setTimeout(() => {
      setJudgmentMade(true);
      setIsJudging(false);
      setShowingResult(true);
    }, 3000);
  };

  const renderMessages = () => {
    return messages.map((msg, index) => {
      let role;
      if (msg.role === "system") {
        role = "system";
      } else if (msg.role === "user") {
        role = "user";
      } else {
        role = "assistant";
      }

      const backgroundColor =
        role === "user"
          ? "rgba(33, 150, 243, 0.1)"
          : role === "system"
            ? "rgba(139, 195, 74, 0.1)"
            : "rgba(255, 202, 40, 0.1)";
      const avatarBgColor =
        role === "user" ? "#2196f3" : role === "system" ? "#8bc34a" : "#ffca28";
      const primaryTextColor =
        role === "user" ? "#0d47a1" : role === "system" ? "#33691e" : "#ff6f00";

      let displayName;
      if (role === "system") {
        displayName = "システム";
      } else if (role === "user") {
        displayName = "あなた";
      } else {
        displayName = "CPU";
      }

      let avatarIcon;
      if (role === "system") {
        avatarIcon = <SmartToyIcon />;
      } else if (role === "user") {
        avatarIcon =
          user && user.photoURL ? (
            <Avatar alt="User Avatar" src={user.photoURL} />
          ) : (
            <PersonIcon />
          );
      } else if (role === "assistant") {
        avatarIcon = <SportsEsportsIcon />;
      }

      return (
        <ListItem
          key={index}
          sx={{
            alignItems: "flex-start",
            backgroundColor: backgroundColor,
            borderRadius: 2,
            mb: 1,
            boxShadow: 1,
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ backgroundColor: avatarBgColor }}>
              {avatarIcon}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  color: primaryTextColor,
                }}
              >
                {displayName}
              </Typography>
            }
            secondary={
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {msg.content}
              </Typography>
            }
          />
        </ListItem>
      );
    });
  };

  // 勝敗によるスタイル分岐
  const isWin = result === "You win";
  const resultBgColor = isWin
    ? theme.palette.success.main
    : theme.palette.info.main;
  const resultEmoji = isWin ? "🎉" : "😢";
  const resultTextColor = "#ffffff";

  // ボタン共通スタイル
  const buttonStyle = {
    mb: 2,
    borderRadius: 2,
    fontWeight: "bold",
    textTransform: "none",
    color: "#fff",
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box>
          {/* チャットログ */}
          <Paper
            elevation={3}
            sx={{
              maxHeight: 400,
              overflowY: "auto",
              p: 2,
              mb: 2,
              backgroundColor: "#fafafa",
            }}
          >
            <List sx={{ pb: 0 }}>
              {Array.isArray(messages) ? (
                renderMessages()
              ) : (
                <ListItem>
                  <ListItemText primary="チャットログがありません。" />
                </ListItem>
              )}
              {isAIGenerating && (
                <ListItem>
                  <CircularProgress size={24} />
                </ListItem>
              )}
              <div ref={chatEndRef} />
            </List>
          </Paper>

          {/* 判定前表示 */}
          {!judgmentMade && !isJudging && (
            <Typography
              variant="body1"
              sx={{ mb: 2, textAlign: "right", color: "text.secondary" }}
            >
              残りターン数: {Math.max(maxTurn - currentTurn, 0)}
            </Typography>
          )}

          {/* isHuman === false の場合、生成ボタンと生成された回答表示 */}
          {!judgmentMade && !isJudging && !isHuman && (
            <Box mb={2}>
              <Button
                variant="contained"
                onClick={generateMessage}
                disabled={isGenerating || isAIGenerating}
                startIcon={<CreateIcon />}
                fullWidth
                sx={buttonStyle}
              >
                {isGenerating ? (
                  <>
                    <CircularProgress
                      size={20}
                      sx={{ marginRight: 1, color: "#fff" }}
                    />
                    メッセージ生成中...
                  </>
                ) : (
                  "メッセージ生成"
                )}
              </Button>

              <Fade in={showGeneratedAnswer}>
                <Card
                  elevation={2}
                  sx={{
                    mb: 2,
                    backgroundColor: "#e1f5fe",
                    borderRadius: 2,
                    border: "1px solid #81d4fa",
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <SmartToyIcon sx={{ mr: 1, color: "#0277bd" }} />
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", color: "#0277bd" }}
                      >
                        生成された回答
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        backgroundColor: "white",
                        p: 2,
                        borderRadius: 1,
                        boxShadow: 1,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {sendMessage}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>

              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={!sendMessage.trim() || isGenerating}
                fullWidth
                startIcon={<SendIcon />}
                sx={buttonStyle}
              >
                {false ? (
                  <CircularProgress size={24} sx={{ color: "#fff" }} />
                ) : (
                  "送信"
                )}
              </Button>
            </Box>
          )}

          {/* 人間が操作する場合の入力欄 */}
          {isHuman && !judgmentMade && !isJudging && (
            <Box>
              <TextField
                label="メッセージを入力"
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                fullWidth
                disabled={isGenerating}
                sx={{ backgroundColor: "white", mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={isGenerating || sendMessage.trim() === ""}
                fullWidth
                startIcon={<SendIcon />}
                sx={buttonStyle}
              >
                {isGenerating ? (
                  <CircularProgress size={24} sx={{ color: "#fff" }} />
                ) : (
                  "送信"
                )}
              </Button>
            </Box>
          )}

          {/* 判定中 */}
          {isJudging && !judgmentMade && (
            <Box
              mt={4}
              display="flex"
              flexDirection="column"
              alignItems="center"
            >
              <CircularProgress size={40} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                判定中...
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 1, color: "text.secondary" }}
              >
                しばらくお待ちください
              </Typography>
            </Box>
          )}

          {/* 判定結果表示 */}
          {judgmentMade && showingResult && (
            <Fade in={showingResult}>
              <Box mt={4} display="flex" justifyContent="center">
                <Card
                  sx={{
                    maxWidth: 400,
                    width: "100%",
                    textAlign: "center",
                    p: 2,
                    backgroundColor: resultBgColor,
                    color: resultTextColor,
                    borderRadius: 2,
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h4"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      {result} {resultEmoji}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ mt: 2, mb: 4, whiteSpace: "pre-wrap" }}
                    >
                      判定理由: {judgmentReason}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate("/")}
                      sx={{
                        backgroundColor: "#ffffff",
                        color: "#333",
                        fontWeight: "bold",
                        "&:hover": {
                          backgroundColor: "#f0f0f0",
                        },
                      }}
                    >
                      ホームに戻る
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            </Fade>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default SingleBattleView;
