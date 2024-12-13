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
import { auth, firestore } from "../API/firebase_f.ts";
import SendIcon from "@mui/icons-material/Send";
import CreateIcon from "@mui/icons-material/Create";
import ForumIcon from "@mui/icons-material/Forum";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SchoolIcon from "@mui/icons-material/School";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { DATABASE_PATHS } from "../shared/database-paths.ts";
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export type Difficulty = "初級" | "中級" | "上級";

let theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#ff4081",
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
  bot: BotSetting;
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

  const [topic, setTopic] = useState<string>("");
  const [topicLoading, setTopicLoading] = useState<boolean>(false);

  useEffect(() => {
    if (location.state) {
      const { bot, difficulty, isHuman } =
        location.state as SingleBattleViewProps;
      setBot(bot);
      setDifficulty(difficulty);
      setIsHuman(isHuman);
      const initializeTopic = async () => {
        setTopicLoading(true);
        const newTopic = await generateSingleTopic();
        setTopic(newTopic);
        setTopicLoading(false);
      };
      initializeTopic();
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
      setCurrentTurn((prevTurn) => prevTurn + 1);
    } else {
      setCurrentTurn((prevTurn) => prevTurn + 1);
      setIsAIGenerating(true); //AIの返信を生成
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    const fetchAIResponse = async () => {
      if (isAIGenerating) {
        const aiResponse = await generateTestMessage(messages);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: aiResponse,
          },
        ]);
        setIsAIGenerating(false);
        if (currentTurn + 1 === maxTurn) {
          makeAIJudgment();
        }
        setCurrentTurn((prevTurn) => prevTurn + 1);
      }
    };
    fetchAIResponse();
  }, [messages]);

  const generateMessage = async () => {
    setIsGenerating(true);
    if (bot) {
      const response = await generateSingleMessage(bot, messages, topic);
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
    const aiJudgmentResponse = await AIJudgement(messages, topic, difficulty);
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

  useEffect(() => {
    if (result && judgmentReason) {
      saveSingleBattleDataToStore();
    }
    // eslint-disable-next-line
  }, [result, judgmentReason]);

  /** ルームデータをFirestoreにバックアップ
   * @param battleId バトルルームID
   */
  const saveSingleBattleDataToStore = async () => {
    if (!user) return;
    try {
      const backupRef = doc(
        firestore,
        DATABASE_PATHS.singleBattleBackups(user.uid)
      );
      const backupData = {
        player: user.displayName,
        topic: topic,
        difficulty: difficulty,
        isHuman: isHuman,
        bot: bot,
        messages: messages,
        result: result,
        judgmentReason: judgmentReason,
      };

      const docSnapshot = await getDoc(backupRef); // ドキュメントの存在を確認

      if (docSnapshot.exists()) {
        // ドキュメントが存在する場合、配列にデータを追加
        await updateDoc(backupRef, {
          backups: arrayUnion(backupData),
        });
        console.log("Backup data successfully added to array!");
      } else {
        // ドキュメントが存在しない場合、新しく作成
        await setDoc(backupRef, {
          backups: [backupData], // 配列として初期化
        });
        console.log("Backup data successfully created and added!");
      }
    } catch (error) {
      console.error(
        "Firestoreへのバックアップ中にエラーが発生しました:",
        error
      );
    }
  };

  const renderMessages = () => {
    const filtered = messages.filter((msg) => msg.role !== "system");
    if (filtered.length === 0) {
      // メッセージがない場合、フレンドリーなメッセージとアイコンを表示
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{ py: 5 }}
        >
          <ChatBubbleOutlineIcon
            sx={{ fontSize: 40, color: "#9e9e9e", mb: 2 }}
          />
          <Typography
            variant="body1"
            sx={{ color: "#757575", textAlign: "center" }}
          >
            まだメッセージはありません。
            <br />
            下の入力欄からチャットを開始しましょう！
          </Typography>
        </Box>
      );
    }

    return filtered.map((msg, index) => {
      const role = msg.role === "user" ? "user" : "assistant";
      const backgroundColor =
        role === "user" ? "rgba(33, 150, 243, 0.1)" : "rgba(255, 202, 40, 0.1)";
      const avatarBgColor = role === "user" ? "#2196f3" : "#ffca28";
      const primaryTextColor = role === "user" ? "#0d47a1" : "#ff6f00";
      const displayName = role === "user" ? "あなた" : "CPU（相手）";

      let avatarIcon;
      if (role === "user") {
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
  const isWin = result === "勝利！";
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

  const turnsLeft = Math.max(maxTurn - currentTurn, 0);

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
        {/* 難易度、トピック、残りターン数表示カード */}
        {!judgmentMade && !isJudging && (
          <Card
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: "#e3f2fd",
              borderRadius: 2,
              border: "1px solid #90caf9",
            }}
          >
            <CardContent>
              {/* 難易度 */}
              <Box display="flex" alignItems="center" mb={1}>
                <SchoolIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  難易度: {difficulty}
                </Typography>
              </Box>

              {/* トピック */}
              <Box display="flex" alignItems="center" mb={1} sx={{ mt: 2 }}>
                <LightbulbOutlinedIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {topicLoading ? (
                    <>
                      トピック生成中...　
                      <CircularProgress
                        size={20}
                        sx={{ color: "text.primary" }}
                      />
                    </>
                  ) : (
                    topic
                  )}
                </Typography>
              </Box>

              {/* 残りターン数 */}
              <Box display="flex" alignItems="center" sx={{ mt: 2 }}>
                <HourglassEmptyIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  残りターン数: {turnsLeft}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={{ mb: 2 }}>
          {/* チャットログタイトルとアイコンをカード状に */}
          <Paper
            elevation={1}
            sx={{
              display: "flex",
              alignItems: "center",
              p: 1,
              mb: 1,
              backgroundColor: "#f0f4c3",
              borderRadius: 2,
              border: "1px solid #dce775",
            }}
          >
            <ForumIcon sx={{ mr: 1, color: "#7cb342" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              チャットログ
            </Typography>
          </Paper>

          {/* チャットログ */}
          <Paper
            elevation={3}
            sx={{
              maxHeight: 400,
              overflowY: "auto",
              p: 2,
              backgroundColor: "#fafafa",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <List sx={{ pb: 0, minHeight: 200 }}>
              {Array.isArray(messages) ? (
                renderMessages()
              ) : (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  sx={{ py: 5 }}
                >
                  <ChatBubbleOutlineIcon
                    sx={{ fontSize: 40, color: "#9e9e9e", mb: 2 }}
                  />
                  <Typography
                    variant="body1"
                    sx={{ color: "#757575", textAlign: "center" }}
                  >
                    まだメッセージはありません。
                    <br />
                    下の入力欄からチャットを開始しましょう！
                  </Typography>
                </Box>
              )}
              {isAIGenerating && (
                <ListItem>
                  <CircularProgress size={24} />
                </ListItem>
              )}
              <div ref={chatEndRef} />
            </List>
          </Paper>
        </Box>

        {/* isHuman === false の場合、生成ボタンと生成された回答表示 */}
        {!judgmentMade && !isJudging && !isHuman && (
          <Box mb={2}>
            <Button
              variant={"contained"}
              onClick={generateMessage}
              disabled={isGenerating || isAIGenerating || topicLoading}
              startIcon={<CreateIcon />}
              color={sendMessage ? "secondary" : "primary"}
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
              ) : sendMessage ? (
                "再生成"
              ) : (
                "メッセージ生成"
              )}
            </Button>

            <Fade in={!topicLoading}>
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
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {isGenerating ? (
                        <CircularProgress
                          size={20}
                          sx={{ marginRight: 1, color: "primary" }}
                        />
                      ) : (
                        sendMessage
                      )}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Fade>

            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!sendMessage.trim() || isGenerating || topicLoading}
              fullWidth
              startIcon={<SendIcon />}
              sx={buttonStyle}
            >
              送信
            </Button>
          </Box>
        )}

        {/* 人間が操作する場合の入力欄 */}
        {isHuman && !judgmentMade && !isJudging && !topicLoading && (
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
          <Box mt={4} display="flex" flexDirection="column" alignItems="center">
            <CircularProgress size={40} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              判定中...
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
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
                    判定理由:
                    {judgmentReason}
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
      </Container>
    </ThemeProvider>
  );
};

export default SingleBattleView;
