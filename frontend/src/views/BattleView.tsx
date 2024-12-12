// frontend/src/views/BattleView.tsx
import React, { useState, useEffect, useRef } from "react";
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
import {
  PlayerData,
  SubmitAnswer,
  ResultData,
  BotSetting,
  GPTMessage,
  BattleRoomData,
  Message,
} from "../shared/types";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { auth } from "../API/firebase_f.ts";
import { ResultViewProps } from "./ResultView.tsx";
import { generateBattleMessage } from "../API/chatGPT_f.ts";
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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Avatar,
  ListItemAvatar,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { appPaths } from "../App.tsx";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import CreateIcon from "@mui/icons-material/Create";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

export interface BattleViewProps {
  battleData: BattleRoomData;
  isHuman: boolean;
  bot: BotSetting | null;
}

const BattleView: React.FC = () => {
  //#region init
  const protoBattleId = useParams();
  const battleId = protoBattleId.battleRoomId as string;
  const location = useLocation();
  const navigate = useNavigate();

  const [battleData, setBattleData] = useState<BattleRoomData | null>(null);
  // const [chatData, setChatData] = useState<ChatData | null>(null);
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
  const [generatedAnswer, setGeneratedAnswer] = useState<string>(""); // 生成された回答

  const [answer, setAnswer] = useState<SubmitAnswer>({
    playerId: "",
    isHuman: true,
    select: true,
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const endRef = useRef<HTMLDivElement | null>(null); // スクロール用の参照

  const myId = auth.currentUser?.uid || "";
  const [myName, setMyName] = useState<string>("");
  const [myData, setMyData] = useState<PlayerData | null>(null);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [opponentData, setOpponentData] = useState<PlayerData | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const user = auth.currentUser;
  //#endregion

  //#region loading
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      if (location.state) {
        //通常遷移 前の画面からデータを受け取る
        console.log("get BattleRoomData from location.state");
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
        //オンラインでデータを取得
        console.log("get BattleRoomData from online");
        const fetchedBattleData = await getBattleRoomData(battleId);
        if (fetchedBattleData) {
          setBattleData(fetchedBattleData);

          //バトルログの更新
          const fetchChatData = await getChatData(battleId);

          if (fetchChatData) {
            setMessages(Object.values(fetchChatData.messages));
            setCurrentTurn(fetchChatData.currentTurn);
            setIsMyTurn(fetchChatData.activePlayerId === myId);
          } else {
            console.error("Failed to fetch battle log");
          }

          // 自分のプレイヤーデータを取得
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
          // エラーハンドリング
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleData]);

  //#endregion

  //#region メッセージ処理
  // メッセージを送信する
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
    }
  };

  // ボットによるメッセージ生成
  const generateMessage = async () => {
    setIsGenerating(true);
    if (bot && battleData) {
      const generatedMessage = await generateBattleMessage(
        messages,
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

  // メッセージ更新リスナー
  useEffect(() => {
    if (!battleId) return;

    const unsubscribe = () =>
      onUpdateChatData(battleId, (newChatData) => {
        if (!newChatData) return;
        if (newChatData.messages && !isSubmitted) {
          const newMessage = newChatData.messages;
          console.log("onMessageAdded:", newMessage);
          setMessages(Object.values(newMessage));
        }
        setIsMyTurn(newChatData.activePlayerId === myId);
        setCurrentTurn(newChatData.currentTurn);
      });
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    onUpdateChatData(battleId, (updatedLog) => {
      console.log("Battle Log Updated:", updatedLog);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId]);

  //#endregion

  //#region バトル終了時の処理

  useEffect(() => {
    if (battleData) {
      setRemainTurn(battleData.battleRule.maxTurn - currentTurn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn, battleData]);

  // 残りターンが0の場合
  useEffect(() => {
    if (remainTurn === 0 && !loading) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      console.log("Battle Ended");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainTurn]);

  // 回答を送信する
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

  // タイマーの処理
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isMyTurn]);

  const exitBattle = () => {
    const isConfirmed = window.confirm("解散しますか？");

    if (isConfirmed) {
      // 「OK」がクリックされた場合の処理
      // disband();
      navigate(appPaths.HomeView);
    } else {
      // 「キャンセル」の場合は何もしない
      console.log("解散がキャンセルされました。");
    }
  };

  // ターンが切り替わる際にタイマーをリセット
  useEffect(() => {
    if (!battleData || loading) return;
    setTimeLeft(battleData.battleRule.oneTurnTime);
    setIsTimeout(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurn, battleData]);

  // リザルトを監視する
  useEffect(() => {
    if (isSubmitted && battleId && !loading) {
      const unsubscribe = onResultUpdated(battleId, isHost, (result) => {
        if (result) {
          console.log("Result updated:", result);
          toResultSegue(result);
        }
      });
      return () => {
        unsubscribe();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitted]);

  // 結果画面への遷移
  const toResultSegue = (result: ResultData) => {
    const props: ResultViewProps = {
      resultData: result,
    };
    console.log("ResultView props:", props);
    navigate(appPaths.ResultView(battleId), { state: props });
  };
  //#endregion

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
          {/* <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
            sx={{ textTransform: "none", color: "#fff", mr: 2 }}
          >
            戻る
          </Button> */}
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
            対戦画面
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box mt={4}>
          {/* トピックとターン情報 */}
          <Box mb={2}>
            {/* <Typography variant="h5" gutterBottom>
              {battleData ? battleData.battleRule.topic : ""}
            </Typography> */}
            <Typography variant="body1">
              ターンプレーヤー: {isMyTurn ? "あなた" : "相手"}
            </Typography>
            <Typography variant="body1">
              このターンの残り時間: {timeLeft} 秒
            </Typography>
            <LinearProgress
              variant="determinate"
              value={
                battleData
                  ? (timeLeft / battleData.battleRule.oneTurnTime) * 100
                  : 0
              }
              sx={{ mt: 1 }}
            />
          </Box>

          {/* チャットログ */}
          <Paper
            elevation={3}
            sx={{ maxHeight: 300, overflowY: "auto", p: 2, mb: 2 }}
          >
            <List>
              {Array.isArray(messages) ? (
                messages.map((msg, index) => {
                  // 送信者別のロール的な扱い
                  let role;
                  if (msg.senderId === "system") {
                    role = "system";
                  } else if (msg.senderId === myId) {
                    role = "user";
                  } else {
                    role = "player";
                  }

                  // 背景色、アバター色、テキスト色などをroleに合わせて決定
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

                  // primary表示名
                  let displayName;
                  if (role === "system") {
                    displayName = "システム";
                  } else if (role === "user") {
                    displayName = myName || "あなた";
                  } else {
                    displayName =
                      playerNames?.[msg.senderId] || "Unknown Player";
                  }

                  // アバターアイコン
                  let avatarIcon;
                  if (role === "system") {
                    avatarIcon = <SmartToyIcon />;
                  } else if (role === "user") {
                    // ユーザーのアイコン（user.photoURLがある場合はそれを使用）
                    avatarIcon = myData?.iconURL ? (
                      <Avatar src={myData?.iconURL} alt="User Avatar" />
                    ) : (
                      <PersonIcon />
                    );
                  } else if (role === "player") {
                    // 他はとりあえずPersonIcon
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
                <ListItem>
                  <ListItemText primary="チャットログがありません。" />
                </ListItem>
              )}
            </List>
          </Paper>

          <Typography variant="body1">
            残りメッセージ数: {remainTurn}
          </Typography>
          {/* メッセージ入力 */}
          {remainTurn > 0 ? (
            <Box mb={2}>
              <>
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
                      transition:
                        "background-color 0.3s ease, border-color 0.3s ease",
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
                ) : (
                  <div>
                    <Box>
                      <TextField
                        label="命令（オプション）"
                        value={promptInstruction}
                        onChange={(e) => setPromptInstruction(e.target.value)}
                        fullWidth
                        sx={{
                          mb: 2,
                          backgroundColor: isMyTurn ? "white" : "grey.200",
                          border: isMyTurn
                            ? "2px solid #3f51b5"
                            : "1px solid grey",
                          transition:
                            "background-color 0.3s ease, border-color 0.3s ease",
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
                            ? "primary.main"
                            : "grey.300",
                          color: isMyTurn ? "white" : "grey.500",
                          "&:hover": {
                            backgroundColor: isMyTurn
                              ? "primary.dark"
                              : "grey.300",
                          },
                          transition:
                            "background-color 0.3s ease, color 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isGenerating ? (
                          <>
                            <CircularProgress
                              size={20}
                              sx={{ marginRight: 1 }}
                            />
                            生成中...
                          </>
                        ) : (
                          <>
                            <CreateIcon />
                            メッセージ生成
                          </>
                        )}
                      </Button>
                    </Box>
                    <Box
                      mt={4}
                      p={2}
                      sx={{
                        backgroundColor: "info.main",
                        color: "white",
                        borderRadius: 2,
                        boxShadow: 3,
                      }}
                      ref={endRef} // スクロール用の参照
                    >
                      <Typography variant="h6" gutterBottom>
                        生成された回答:
                      </Typography>
                      <Typography variant="body1">{generatedAnswer}</Typography>
                    </Box>
                  </div>
                )}
              </>
              {/* 生成された回答表示エリア */}

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
                    transition: "background-color 0.3s ease, color 0.3s ease",
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
              {/* バトル終了メッセージ */}
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
                ref={endRef} // スクロール先として参照
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

          {/* 回答送信エリア */}
          {remainTurn === 0 && !isSubmitted && (
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                チャット相手は人間？それともAI？
              </Typography>
              <FormControl component="fieldset">
                <FormLabel component="legend">相手の正体を選択</FormLabel>
                <RadioGroup
                  value={
                    answer.select !== null ? String(answer.select) : "false"
                  }
                  onChange={(e) =>
                    setAnswer((prevAnswer) => ({
                      ...prevAnswer,
                      select: e.target.value === "true", // "true" or "false" を論理値に変換
                    }))
                  }
                >
                  <FormControlLabel
                    value="true"
                    control={<Radio />}
                    label="人間"
                  />
                  <FormControlLabel
                    value="false"
                    control={<Radio />}
                    label="AI"
                  />
                </RadioGroup>
              </FormControl>
              <TextField
                label="理由"
                value={answer.message}
                onChange={(e) =>
                  setAnswer((prevAnswer) => ({
                    ...prevAnswer,
                    message: e.target.value,
                  }))
                }
                fullWidth
                multiline
                rows={4}
                sx={{ mt: 2 }}
              />
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitted ||
                    answer.select === null ||
                    answer.message.trim() === ""
                  }
                >
                  {isSubmitted ? (
                    "送信完了"
                  ) : (
                    <>
                      <SendIcon />
                      送信
                    </>
                  )}
                </Button>
              </Box>
            </Box>
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
