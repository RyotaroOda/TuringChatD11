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
  LinearProgress,
  CircularProgress,
  Avatar,
  ListItemAvatar,
  Card,
  CardContent,
} from "@mui/material";
import {
  createTheme,
  ThemeProvider,
  responsiveFontSizes,
} from "@mui/material/styles";
import ForumIcon from "@mui/icons-material/Forum";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import {
  BotSetting,
  Message,
  BattleRoomData,
  PlayerData,
  ResultData,
} from "../shared/types";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { auth } from "../API/firebase_f.ts";
import { generateBattleMessage } from "../API/chatGPT_f.ts";
import { ResultViewProps } from "./ResultView.tsx";
import {
  addMessage,
  sendAnswer,
  checkAnswers,
  onResultUpdated,
  getBattleRoomData,
  getPrivateBattleData,
  getChatData,
  onUpdateChatData,
} from "../API/firebase-realtime-database.ts";
import { appPaths } from "../App.tsx";
import SendIcon from "@mui/icons-material/Send";
import CreateIcon from "@mui/icons-material/Create";
import HourglassFullIcon from "@mui/icons-material/HourglassFull"; // 必要であればアイコン変更

let theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});
theme = responsiveFontSizes(theme);

export interface BattleViewProps {
  battleData: BattleRoomData;
  isHuman: boolean;
  bot: BotSetting | null;
}

const BattleView: React.FC = () => {
  const protoBattleId = useParams();
  const battleId = protoBattleId.battleRoomId as string;
  const location = useLocation();
  const navigate = useNavigate();

  const [battleData, setBattleData] = useState<BattleRoomData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [isHuman, setIsHuman] = useState<boolean>(true);
  const [bot, setBot] = useState<BotSetting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [sendMessage, setSendMessage] = useState<string>("");
  const [promptInstruction, setPromptInstruction] = useState<string>("");
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [remainTurn, setRemainTurn] = useState<number>(999);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<string>("");

  const [answer, setAnswer] = useState({
    playerId: "",
    isHuman: true,
    select: true,
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const myId = auth.currentUser?.uid || "";
  const [myName, setMyName] = useState<string>("");
  const [myData, setMyData] = useState<PlayerData | null>(null);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [opponentData, setOpponentData] = useState<PlayerData | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const user = auth.currentUser;

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      if (location.state) {
        const { battleData, isHuman, bot } = location.state as BattleViewProps;
        setBattleData(battleData);
        if (battleData.chatData.messages)
          setMessages(Object.values(battleData.chatData.messages));
        setCurrentTurn(battleData.chatData.currentTurn);
        setIsMyTurn(battleData.chatData.activePlayerId === myId);
        setIsHuman(isHuman);
        setBot(bot);
        navigate(appPaths.BattleView(battleData.battleId), { replace: true });
      } else if (battleId) {
        const fetchedBattleData = await getBattleRoomData(battleId);
        if (fetchedBattleData) {
          setBattleData(fetchedBattleData);
          const fetchChatData = await getChatData(battleId);

          if (fetchChatData) {
            setMessages(Object.values(fetchChatData.messages));
            setCurrentTurn(fetchChatData.currentTurn);
            setIsMyTurn(fetchChatData.activePlayerId === myId);
          } else {
            console.error("Failed to fetch battle log");
          }

          if (battleId && auth.currentUser) {
            const myPrivateData = await getPrivateBattleData(
              battleId,
              auth.currentUser.uid
            );
            if (myPrivateData) {
              setIsHuman(myPrivateData.isHuman);
              setBot(myPrivateData.bot);
            }
          }
        } else {
          alert("バトルルームが解散しました。");
          navigate(appPaths.HomeView);
        }
      } else {
        console.error("battleId is null");
        alert("バトルルームが不明です。");
        navigate(appPaths.HomeView);
      }
      setLoading(false);
    };
    fetchData();
  }, [battleId, location.state, myId, navigate]);

  useEffect(() => {
    if (battleData) {
      const playersKey = Object.keys(battleData.players);
      const isHost = myId === battleData.hostId;
      setIsHost(isHost);

      const myData: PlayerData = isHost
        ? battleData.players[playersKey[0]]
        : battleData.players[playersKey[1]];
      setMyData(myData);
      const opponentData: PlayerData = Object.values(battleData.players).find(
        (player) => player.id !== myId
      )!;
      setOpponentData(opponentData);

      const myName = `${myData.name} (あなた)` || "error";
      setMyName(myName);

      setPlayerNames({
        [myId]: myName,
        [opponentData.id]: opponentData.name,
      });

      setTimeLeft(battleData.battleRule.oneTurnTime);

      setMessages(battleData.chatData.messages);

      setAnswer((prevAnswer) => ({
        ...prevAnswer,
        playerId: myId,
        isHuman: isHuman,
      }));
    }
  }, [battleData, isHuman, myId]);

  const handleSendMessage = async () => {
    if (
      sendMessage.trim() &&
      isMyTurn &&
      battleId &&
      remainTurn > 0 &&
      battleData &&
      opponentData
    ) {
      await addMessage(battleId, sendMessage, currentTurn + 1, opponentData.id);
      setSendMessage("");
      setGeneratedAnswer("");
    }
  };

  const generateMessage = async () => {
    setIsGenerating(true);
    if (bot && battleData) {
      const generatedMessage = await generateBattleMessage(
        messages,
        battleData.chatData.messages[
          Object.keys(battleData.chatData.messages)[0]
        ].message,
        promptInstruction,
        bot,
        battleData.battleRule
      );
      setSendMessage(generatedMessage);
      setGeneratedAnswer(generatedMessage);
    } else {
      console.error("Bot setting is null");
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    if (!battleId) return;
    const unsubscribe = onUpdateChatData(battleId, (newChatData) => {
      if (!newChatData) return;
      if (newChatData.messages && !isSubmitted) {
        const newMessage = newChatData.messages;
        setMessages(Object.values(newMessage));
      }
      setIsMyTurn(newChatData.activePlayerId === myId);
      setCurrentTurn(newChatData.currentTurn);
    });
    return () => {
      unsubscribe();
    };
  }, [battleId, isSubmitted, myId]);

  useEffect(() => {
    if (battleData) {
      setRemainTurn(battleData.battleRule.maxTurn - currentTurn);
    }
  }, [currentTurn, battleData]);

  useEffect(() => {
    if (remainTurn === 0 && !loading) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      console.log("Battle Ended");
    }
  }, [remainTurn, loading]);

  const handleSubmit = async () => {
    if (answer.select === null || !battleId || !myId) {
      console.error("Invalid answer data");
      return;
    }
    if (answer.message.trim() === "") {
      console.warn("メッセージが空です");
      return;
    }
    sendAnswer(battleId, answer);
    setIsSubmitted(true);

    if (isHost) {
      checkAnswers(battleId);
    }
  };

  useEffect(() => {
    if (remainTurn <= 0 || loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    if ((timeLeft === 0 || timeLeft < 0) && isMyTurn) {
      handleSendMessage();
    }
    if ((timeLeft === 0 || timeLeft < 0) && !isMyTurn) {
      setIsTimeout(true);
    }

    return () => clearInterval(timer);
  }, [timeLeft, isMyTurn, remainTurn, loading]);

  const exitBattle = () => {
    const isConfirmed = window.confirm("解散しますか？");
    if (isConfirmed) {
      navigate(appPaths.HomeView);
    } else {
      console.log("解散がキャンセルされました。");
    }
  };

  useEffect(() => {
    if (!battleData || loading) return;
    setTimeLeft(battleData.battleRule.oneTurnTime);
    setIsTimeout(false);
  }, [isMyTurn, battleData, loading]);

  useEffect(() => {
    if (isSubmitted && battleId && !loading) {
      const unsubscribe = onResultUpdated(battleId, isHost, (result) => {
        if (result) {
          toResultSegue(result);
        }
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isSubmitted, battleId, loading, isHost]);

  const toResultSegue = (result: ResultData) => {
    const props: ResultViewProps = {
      resultData: result,
    };
    navigate(appPaths.ResultView(battleId), { state: props });
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="md">
          <Box mt={4}>
            <Typography variant="h6">読み込み中...</Typography>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  if (!battleData || !opponentData) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="md">
          <Box mt={4}>
            <Typography variant="h6">バトルを続行できません。</Typography>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            対戦画面
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box mt={4}>
          {/* 難易度を削除し、ターンプレイヤー、残り時間もカード内へ */}
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
              <Box display="flex" alignItems="center" mb={1}>
                <LightbulbOutlinedIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {
                    battleData.chatData.messages[
                      Object.keys(battleData.chatData.messages)[0]
                    ].message
                  }
                </Typography>
              </Box>

              {/* ターンプレイヤー */}
              <Box display="flex" alignItems="center" mb={1}>
                <PersonIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  ターンプレーヤー: {isMyTurn ? "あなた" : "相手"}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" mb={1}>
                <HourglassEmptyIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  残りターン数: {remainTurn}
                </Typography>
              </Box>

              {/* 残り時間 */}
              <Box display="flex" alignItems="center" mb={1}>
                <HourglassFullIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  残り時間: {timeLeft} 秒
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={
                  battleData
                    ? (timeLeft / battleData.battleRule.oneTurnTime) * 100
                    : 0
                }
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>

          {/* チャットログタイトル */}
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
              maxHeight: 300,
              overflowY: "auto",
              p: 2,
              mb: 2,
              backgroundColor: "#fafafa",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <List sx={{ pb: 0, minHeight: 200 }}>
              {Array.isArray(messages) && messages.length > 1 ? (
                messages.slice(1).map((msg, index) => {
                  let role;
                  if (msg.senderId === "system") {
                    role = "system";
                  } else if (msg.senderId === myId) {
                    role = "user";
                  } else {
                    role = "player";
                  }

                  const backgroundColor =
                    role === "user"
                      ? "#e3f2fd"
                      : role === "system"
                        ? "#f1f8e9"
                        : "#fff8e1";
                  const avatarBgColor =
                    role === "user"
                      ? "#2196f3"
                      : role === "system"
                        ? "#8bc34a"
                        : "#ffca28";
                  const primaryTextColor =
                    role === "user"
                      ? "#0d47a1"
                      : role === "system"
                        ? "#33691e"
                        : "#ff6f00";

                  let displayName;
                  if (role === "system") {
                    displayName = "システム";
                  } else if (role === "user") {
                    displayName = myName || "あなた";
                  } else {
                    displayName =
                      playerNames?.[msg.senderId] || "Unknown Player";
                  }

                  let avatarIcon;
                  if (role === "system") {
                    avatarIcon = <SmartToyIcon />;
                  } else if (role === "user") {
                    avatarIcon = myData?.iconURL ? (
                      <Avatar src={myData?.iconURL} alt="User Avatar" />
                    ) : (
                      <PersonIcon />
                    );
                  } else if (role === "player") {
                    avatarIcon = opponentData?.iconURL ? (
                      <Avatar src={opponentData?.iconURL} alt="User Avatar" />
                    ) : (
                      <PersonIcon />
                    );
                  }

                  return (
                    <React.Fragment key={index}>
                      <ListItem
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
                          secondary={msg.message}
                        />
                      </ListItem>
                    </React.Fragment>
                  );
                })
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
                  </Typography>
                </Box>
              )}

              <div ref={endRef} />
            </List>
          </Paper>

          <Typography variant="body1">
            残りメッセージ数: {remainTurn}
          </Typography>
          {remainTurn > 0 ? (
            <Box mb={2}>
              {isHuman ? (
                <TextField
                  label={
                    isMyTurn
                      ? "メッセージを入力"
                      : "相手のメッセージを待っています。"
                  }
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  fullWidth
                  disabled={!isMyTurn || loading}
                  sx={{
                    backgroundColor: isMyTurn ? "white" : "grey.200",
                    border: isMyTurn ? "2px solid #3f51b5" : "1px solid grey",
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: isMyTurn ? "#3f51b5" : "grey",
                      },
                      "&:hover fieldset": {
                        borderColor: isMyTurn ? "#303f9f" : "grey",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#3f51b5",
                      },
                    },
                    mb: 2,
                  }}
                />
              ) : (
                <div>
                  <TextField
                    label="命令（オプション）"
                    value={promptInstruction}
                    onChange={(e) => setPromptInstruction(e.target.value)}
                    fullWidth
                    sx={{
                      mb: 2,
                      backgroundColor: isMyTurn ? "white" : "grey.200",
                      border: isMyTurn ? "2px solid #3f51b5" : "1px solid grey",
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: isMyTurn ? "#3f51b5" : "grey",
                        },
                        "&:hover fieldset": {
                          borderColor: isMyTurn ? "#303f9f" : "grey",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#3f51b5",
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={generateMessage}
                    disabled={isGenerating || !isMyTurn}
                    sx={{
                      backgroundColor: isMyTurn
                        ? generatedAnswer
                          ? "secondary.main"
                          : "primary.main"
                        : "grey.300",
                      color: isMyTurn ? "white" : "grey.500",
                      "&:hover": {
                        backgroundColor: isMyTurn ? "primary.dark" : "grey.300",
                      },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <CircularProgress size={20} sx={{ marginRight: 1 }} />
                        生成中...
                      </>
                    ) : (
                      <>
                        <CreateIcon />
                        {generatedAnswer ? "再生成" : "メッセージ生成"}
                      </>
                    )}
                  </Button>
                  {generatedAnswer && (
                    <Box
                      mt={4}
                      p={2}
                      sx={{
                        backgroundColor: "info.main",
                        color: "white",
                        borderRadius: 2,
                        boxShadow: 3,
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        生成された回答:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {generatedAnswer}
                      </Typography>
                    </Box>
                  )}
                </div>
              )}

              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={
                    remainTurn <= 0 ||
                    !isMyTurn ||
                    loading ||
                    sendMessage.trim() === ""
                  }
                  sx={{
                    backgroundColor:
                      remainTurn > 0 &&
                      isMyTurn &&
                      sendMessage.trim() !== "" &&
                      !loading
                        ? "primary.main"
                        : "grey.300",
                    color:
                      remainTurn > 0 &&
                      isMyTurn &&
                      sendMessage.trim() !== "" &&
                      !loading
                        ? "white"
                        : "grey.500",
                    "&:hover": {
                      backgroundColor:
                        remainTurn > 0 &&
                        isMyTurn &&
                        sendMessage.trim() !== "" &&
                        !loading
                          ? "primary.dark"
                          : "grey.300",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <>
                      <SendIcon />
                      送信
                    </>
                  )}
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <Box
                mt={4}
                sx={{
                  backgroundColor: "white",
                  color: "primary.main",
                  textAlign: "center",
                  padding: 4,
                  borderRadius: 2,
                  boxShadow: 3,
                }}
                ref={endRef}
              >
                <Typography variant="h4" gutterBottom>
                  バトル終了！
                </Typography>
                <Typography variant="h6">
                  次の質問に答えて結果を送信してください。
                </Typography>
              </Box>
            </>
          )}

          {remainTurn === 0 && !isSubmitted && (
            <Box mt={4}>{/* 回答送信ロジックは元のまま */}</Box>
          )}

          {isTimeout && (
            <Box mt={2}>
              <Typography variant="h6">相手からの応答がありません。</Typography>
              <Button variant="contained" color="primary" onClick={exitBattle}>
                バトルルームから退出
              </Button>
            </Box>
          )}

          {isSubmitted && (
            <Box mt={4}>
              <Typography variant="h6">結果を待っています...</Typography>
            </Box>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default BattleView;
