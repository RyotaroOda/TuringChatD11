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
  Fade,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
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
import HourglassFullIcon from "@mui/icons-material/HourglassFull";
import { set } from "firebase/database";

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

  // バトル／チャットロード中かどうか
  const [loading, setLoading] = useState<boolean>(true);

  // 最初に表示する「話題」の文面
  const [topic, setTopic] = useState<string>("");

  // 入力や生成周り
  const [sendMessage, setSendMessage] = useState<string>("");
  const [promptInstruction, setPromptInstruction] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<string>("");

  // 現在のターン管理
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [remainTurn, setRemainTurn] = useState<number>(999);
  const [currentTurn, setCurrentTurn] = useState<number>(1);

  // タイマー系
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);

  // 回答関連
  const [answer, setAnswer] = useState({
    playerId: "",
    isHuman: true,
    select: true,
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // 自分 & 相手プレイヤー情報
  const myId = auth.currentUser?.uid || "";
  const [myName, setMyName] = useState<string>("");
  const [myData, setMyData] = useState<PlayerData | null>(null);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [opponentData, setOpponentData] = useState<PlayerData | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);

  // チャット末尾スクロール用
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      if (location.state) {
        const { battleData, isHuman, bot } = location.state as BattleViewProps;
        setBattleData(battleData);
        if (battleData.chatData.messages) {
          setMessages(Object.values(battleData.chatData.messages));
        }
        setCurrentTurn(battleData.chatData.currentTurn);
        setIsMyTurn(battleData.chatData.activePlayerId === myId);
        setIsHuman(isHuman);
        setBot(bot);
        navigate(appPaths.BattleView(battleData.battleId), { replace: true });
      } else if (battleId) {
        // バトル情報取得
        const fetchedBattleData = await getBattleRoomData(battleId);
        if (fetchedBattleData) {
          setBattleData(fetchedBattleData);
          // チャット情報取得
          const fetchChatData = await getChatData(battleId);
          if (fetchChatData) {
            setMessages(Object.values(fetchChatData.messages));
            setCurrentTurn(fetchChatData.currentTurn);
            setIsMyTurn(fetchChatData.activePlayerId === myId);
          } else {
            console.error("Failed to fetch battle log");
          }
          // 自分の設定情報
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
      const hostIsMe = myId === battleData.hostId;
      setIsHost(hostIsMe);

      const myPlayerData = hostIsMe
        ? battleData.players[playersKey[0]]
        : battleData.players[playersKey[1]];
      setMyData(myPlayerData);

      // 相手プレイヤーを特定
      const oppData = Object.values(battleData.players).find(
        (player) => player.id !== myId
      )!;
      setOpponentData(oppData);

      const name = (myPlayerData.name || "") + " (あなた)";
      setMyName(name);

      setPlayerNames({
        [myId]: name,
        [oppData.id]: oppData.name,
      });

      // タイマー
      setTimeLeft(battleData.battleRule.oneTurnTime);

      // 回答情報
      setAnswer((prev) => ({
        ...prev,
        playerId: myId,
        isHuman: isHuman,
      }));
    }
  }, [battleData, isHuman, myId]);

  // リアルタイムチャット購読
  useEffect(() => {
    if (!battleId) return;
    const unsubscribe = onUpdateChatData(battleId, (newChatData) => {
      if (!newChatData) return;
      if (newChatData.messages && !isSubmitted) {
        setMessages(Object.values(newChatData.messages));
      }
      setIsMyTurn(newChatData.activePlayerId === myId);
      setCurrentTurn(newChatData.currentTurn);
    });
    return () => {
      unsubscribe();
    };
  }, [battleId, isSubmitted, myId]);

  // 残りターン数
  useEffect(() => {
    if (battleData) {
      setRemainTurn(battleData.battleRule.maxTurn - currentTurn);
    }
  }, [currentTurn, battleData]);

  // バトル終了チェック
  useEffect(() => {
    if (remainTurn === 0 && !loading) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      console.log("Battle Ended");
    }
  }, [remainTurn, loading]);

  // ターン時間切れのタイマー処理
  useEffect(() => {
    if (remainTurn <= 0 || loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    if (timeLeft <= 0 && isMyTurn) {
      // 時間切れ時、自動送信
      handleSendMessage();
    }
    if (timeLeft <= 0 && !isMyTurn) {
      // 相手が出さないまま時間切れ
      setIsTimeout(true);
    }
    return () => clearInterval(timer);
  }, [timeLeft, isMyTurn, remainTurn, loading]);

  // ターン変更でタイマーリセット
  useEffect(() => {
    if (!battleData || loading) return;
    setTimeLeft(battleData.battleRule.oneTurnTime);
    setIsTimeout(false);
  }, [isMyTurn, battleData, loading]);

  // 結果が更新されたかを監視→ホストなら結果決定でResultへ
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

  // 最初（ページ読み込み時）に「話題」(messages[0]) を topic に設定
  // もしすでに topic が空でなく、かつ最初のmessagesに何か入っていればそれを代入。
  useEffect(() => {
    if (!loading && messages.length > 0) {
      // まだtopicが未設定なら最初のメッセージを話題として使う
      if (!topic) {
        setTopic(messages[0].message);
      }
    }
  }, [loading, messages, topic]);

  // チャット送信
  const handleSendMessage = async () => {
    if (
      sendMessage.trim() &&
      isMyTurn &&
      battleId &&
      remainTurn > 0 &&
      battleData &&
      opponentData
    ) {
      // 送信
      await addMessage(battleId, sendMessage, currentTurn + 1, opponentData.id);
      setSendMessage("");
      setGeneratedAnswer("");
    }
  };

  // AI(Bot)用メッセージ生成
  const generateMessage = async () => {
    setIsGenerating(true);
    if (bot && battleData) {
      try {
        // 画面に表示する「話題」を渡す
        const generatedMessage = await generateBattleMessage(
          messages,
          topic,
          promptInstruction,
          bot,
          battleData.battleRule
        );
        setSendMessage(generatedMessage);
        setGeneratedAnswer(generatedMessage);
      } catch (e) {
        console.error(e);
        setGeneratedAnswer(
          "メッセージの生成に失敗しました。もう一度生成して下さい"
        );
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // 回答送信
  const handleSubmit = async () => {
    if (!battleId || !myId) {
      console.error("Invalid answer data or no battleId");
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

  // バトルルーム解散
  const exitBattle = () => {
    const isConfirmed = window.confirm("解散しますか？");
    if (isConfirmed) {
      navigate(appPaths.HomeView);
    } else {
      console.log("解散がキャンセルされました。");
    }
  };

  // 結果画面へ
  const toResultSegue = (result: ResultData) => {
    const props: ResultViewProps = {
      resultData: result,
    };
    navigate(appPaths.ResultView(battleId), { state: props });
  };

  // 勝利条件を表示するためのテキスト
  const victoryCondition = isHuman
    ? "CPU相手に「AI」と誤認させれば勝利"
    : "人間相手に「人間」と誤認させれば勝利";

  // 「システム」メッセージをシングルバトルと同じデザインに
  const renderSystemMessage = (systemText: string) => {
    return (
      <ListItem
        sx={{
          alignItems: "flex-start",
          backgroundColor: "#eeeeee",
          borderRadius: 2,
          mb: 2,
          boxShadow: 1,
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ backgroundColor: "#9e9e9e" }}>
            <ForumIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: "bold",
                color: "#424242",
              }}
            >
              システム
            </Typography>
          }
          secondary={
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {systemText}
            </Typography>
          }
        />
      </ListItem>
    );
  };

  // 通常メッセージを表示するコンポーネント
  const renderMessages = () => {
    // トピック(=systemメッセージ)を先頭に表示
    // その後に通常のメッセージのログを表示
    return (
      <>
        {/* 1) トピック部分。topicが空でなければ system メッセージとして表示 */}
        {topic && renderSystemMessage(topic)}

        {/* 2) それ以降のメッセージ(Log) */}
        {messages.length > 0 ? (
          // messages[0] が話題だった分は飛ばして表示したい場合は slice(1) する。
          // しかし既に topic に入れており、messages[0] にも同じ情報があるので
          // 重複が気になるようなら slice(1) する
          messages.slice(1).map((msg, index) => {
            // 送信者IDからロールを判定
            let role;
            if (msg.senderId === "system") {
              // 何らかのシステムメッセージがあればこちら
              role = "system";
            } else if (msg.senderId === myId) {
              role = "user";
            } else {
              role = "player";
            }

            // 各種スタイルを切り替え
            let backgroundColor = "#fff8e1";
            let avatarBgColor = "#ffca28";
            let primaryTextColor = "#ff6f00";
            let displayName = playerNames?.[msg.senderId] || "Unknown Player";

            if (role === "system") {
              backgroundColor = "#eeeeee";
              avatarBgColor = "#9e9e9e";
              primaryTextColor = "#424242";
              displayName = "システム";
            } else if (role === "user") {
              backgroundColor = "#e3f2fd";
              avatarBgColor = "#2196f3";
              primaryTextColor = "#0d47a1";
              displayName = myName || "あなた";
            }

            // アバターアイコン
            let avatarIcon: React.ReactNode = <PersonIcon />;
            if (role === "system") {
              avatarIcon = <ForumIcon />;
            } else if (role === "user") {
              if (myData?.iconURL) {
                avatarIcon = <Avatar src={myData.iconURL} alt="User Avatar" />;
              } else {
                avatarIcon = <PersonIcon />;
              }
            } else {
              // 敵
              if (opponentData?.iconURL) {
                avatarIcon = (
                  <Avatar src={opponentData?.iconURL} alt="opponent Avatar" />
                );
              }
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
                      {msg.message}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })
        ) : (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            sx={{ py: 3 }}
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
      </>
    );
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
          {/* 勝利条件＋ターン・タイマー情報 */}
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
              {/* 勝利条件 */}
              <Box display="flex" alignItems="center" mb={1}>
                <LightbulbOutlinedIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  勝利条件: {victoryCondition}
                </Typography>
              </Box>

              {/* ターンプレーヤー */}
              <Box display="flex" alignItems="center" mb={1}>
                <PersonIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  ターンプレイヤー: {isMyTurn ? "あなた" : "相手"}
                </Typography>
              </Box>

              {/* 残りターン数 */}
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

          {/* チャットログ本体 */}
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
              {/* 1) ロード中ならぐるぐる表示 */}
              {loading ? (
                <ListItem>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>読み込み中...</Typography>
                </ListItem>
              ) : (
                // 2) ロード完了後はメッセージ表示
                renderMessages()
              )}
              <div ref={endRef} />
            </List>
          </Paper>

          {/* まだターンが残っていればチャット送信UIを表示 */}
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
                        <CreateIcon sx={{ mr: 1.5 }} />
                        {generatedAnswer ? "再生成" : "メッセージ生成"}
                      </>
                    )}
                  </Button>

                  {generatedAnswer && (
                    <Fade in={!!generatedAnswer}>
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
                    </Fade>
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
                      <SendIcon sx={{ mr: 1.5 }} />
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
                      <SendIcon sx={{ mr: 1.5 }} />
                      送信
                    </>
                  )}
                </Button>
              </Box>
            </Box>
          )}

          {/* タイムアウト */}
          {isTimeout && (
            <Box mt={2}>
              <Typography variant="h6">相手からの応答がありません。</Typography>
              <Button variant="contained" color="primary" onClick={exitBattle}>
                バトルルームから退出
              </Button>
            </Box>
          )}

          {/* 回答を送信済みなら結果待ち */}
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
