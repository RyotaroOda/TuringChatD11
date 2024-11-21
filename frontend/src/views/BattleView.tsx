// frontend/src/views/BattleView.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  sendMessage,
  onMessageAdded,
  sendAnswer,
  checkAnswers,
  onResultUpdated,
} from "../services/firebase-realtime-database.ts";
import {
  BattleLog,
  PlayerData,
  RoomData,
  SubmitAnswer,
  ResultData,
  BotSetting,
  GPTMessage,
} from "../shared/types";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase_f.ts";
import { ResultViewProps } from "./ResultView.tsx";
import { generateBattleMessage } from "../services/chatGPT_f.ts";
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
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

export interface BattleViewProps {
  roomId: string;
  roomData: RoomData;
  isHuman: boolean;
  bot: BotSetting | null;
}

const BattleView: React.FC = () => {
  //#region init
  const [isViewLoaded, setIsLoaded] = useState<boolean>(false);
  const location = useLocation();
  const { roomId, roomData, isHuman, bot } = location.state as BattleViewProps;
  const user = auth.currentUser;
  const myId = user?.uid || "error";

  const playersKey = Object.keys(roomData.players);
  const isHost = myId === roomData.hostId;
  const myData: PlayerData = isHost
    ? roomData.players[playersKey[0]]
    : roomData.players[playersKey[1]];
  const opponentData: PlayerData = Object.values(roomData.players).find(
    (player) => player.id !== myId
  )!;

  const myName = `${myData.name} (あなた)` || "error";
  const battleConfig = roomData.battleConfig;
  const playerNames: Record<string, string> = {
    [myId]: myName,
    [opponentData.id]: opponentData.name,
  };

  const navigate = useNavigate();
  const [chatLog, setChatLog] = useState<
    { senderId: string; message: string }[]
  >([]);
  const [message, setMessage] = useState<string>("");
  const [promptMessages, setPromptMessages] = useState<GPTMessage[]>([]);
  const [promptInstruction, setPromptInstruction] = useState<string>("");
  const [isMyTurn, setIsMyTurn] = useState<boolean>(isHost);
  const [remainTurn, setRemainTurn] = useState<number>(
    roomData.battleConfig.maxTurn
  );
  const [timeLeft, setTimeLeft] = useState<number>(battleConfig.oneTurnTime);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<string>(""); // 生成された回答

  const [answer, setAnswer] = useState<SubmitAnswer>({
    playerId: myId,
    isHuman: isHuman,
    select: null,
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const endRef = useRef<HTMLDivElement | null>(null); // スクロール用の参照
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsLoaded(true);
  }, [roomId]);
  //#endregion

  //#region メッセージ処理
  // メッセージを送信する
  const handleSendMessage = async () => {
    if (message.trim() && isMyTurn && roomId && remainTurn > 0) {
      setLoading(true);
      await sendMessage(roomId, message);
      setMessage("");
      setLoading(false);
    }
  };

  // ボットによるメッセージ生成
  const generateMessage = async () => {
    setIsGenerating(true);
    if (bot) {
      const generatedMessage = await generateBattleMessage(
        promptMessages,
        "メッセージ生成",
        bot,
        battleConfig
      );
      setMessage(generatedMessage);
      setGeneratedAnswer(generatedMessage);
    } else {
      console.error("Bot setting is null");
    }
    setIsGenerating(false);
  };

  // メッセージ更新リスナー
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onMessageAdded(roomId, (newMessage) => {
      console.log("onMessageAdded:", newMessage);

      setChatLog((prevChatLog) => {
        // 同じメッセージが追加されないように確認
        const isDuplicate = prevChatLog.some(
          (msg) =>
            msg.senderId === newMessage.senderId &&
            msg.message === newMessage.message
        );
        if (isDuplicate) {
          console.warn("Duplicate message detected, skipping...");
          return prevChatLog; // 同じ内容なら既存のログをそのまま返す
        }
        return [
          ...prevChatLog,
          { senderId: newMessage.senderId, message: newMessage.message },
        ];
      });

      // ボットプレイヤーのためのプロンプトメッセージ処理
      if (!isHuman) {
        const id = newMessage.senderId === myId ? "[opponent]" : "[proponent]";
        setPromptMessages((prevMessages) => [
          ...prevMessages,
          { role: "user", content: id + newMessage.message },
        ]);
      }
    });
  }, [isViewLoaded]);

  // ターンの切り替え
  useEffect(() => {
    if (isViewLoaded) {
      setIsMyTurn((prevTurn) => !prevTurn);
      setRemainTurn((prevCount) => prevCount - 1);
    }
  }, [chatLog]);

  //#endregion

  //#region バトル終了時の処理
  // 残りターンが0の場合
  useEffect(() => {
    if (remainTurn === 0) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      console.log("Battle Ended");
    }
  }, [remainTurn]);

  // 回答を送信する
  const handleSubmit = async () => {
    if (answer.select === null || !roomId || !myId) {
      console.error("Invalid answer data");
      return;
    }
    if (answer.message.trim() === "") {
      console.warn("メッセージが空です");
      return;
    }
    sendAnswer(roomId, answer);
    setIsSubmitted(true);

    if (isHost) {
      checkAnswers(roomId);
    }
  };

  // タイマーの処理
  useEffect(() => {
    if (remainTurn <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    if (timeLeft === 0 && isMyTurn) {
      handleSendMessage();
    }

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isMyTurn]);

  // ターンが切り替わる際にタイマーをリセット
  useEffect(() => {
    if (isMyTurn) {
      setTimeLeft(battleConfig.oneTurnTime);
    }
  }, [isMyTurn, battleConfig.oneTurnTime]);

  // リザルトを監視する
  useEffect(() => {
    if (isSubmitted && roomId) {
      const unsubscribe = onResultUpdated(roomId, isHost, (result) => {
        if (result) {
          console.log("Result updated:", result);
          toResultSegue(result);
        }
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isSubmitted, roomId, isHost]);

  // 結果画面への遷移
  const toResultSegue = (result: ResultData) => {
    const props: ResultViewProps = {
      resultData: result,
    };
    console.log("ResultView props:", props);
    navigate(`/${roomId}/battle/result`, { state: props });
  };
  //#endregion

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
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            対戦画面
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box mt={4}>
          {/* トピックとターン情報 */}
          <Box mb={2}>
            <Typography variant="h5" gutterBottom>
              {battleConfig.topic}
            </Typography>
            <Typography variant="body1">
              ターンプレーヤー: {isMyTurn ? "あなた" : "相手"}
            </Typography>
            <Typography variant="body1">
              このターンの残り時間: {timeLeft} 秒
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(timeLeft / battleConfig.oneTurnTime) * 100}
              sx={{ mt: 1 }}
            />
            <Typography variant="body1">
              残りメッセージ数: {remainTurn}
            </Typography>
          </Box>

          {/* チャットログ */}
          <Paper
            elevation={3}
            sx={{ maxHeight: 300, overflowY: "auto", p: 2, mb: 2 }}
          >
            <List>
              {chatLog.map((msg, index) => (
                <ListItem
                  key={index}
                  sx={{
                    justifyContent:
                      msg.senderId === myId ? "flex-end" : "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: "70%",
                      bgcolor:
                        msg.senderId === myId ? "primary.main" : "grey.300",
                      color: msg.senderId === myId ? "#fff" : "#000",
                      borderRadius: 2,
                      p: 1,
                    }}
                  >
                    <ListItemText
                      primary={msg.message}
                      secondary={
                        msg.senderId === myId
                          ? myName
                          : playerNames[msg.senderId]
                      }
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* メッセージ入力 */}
          {remainTurn > 0 ? (
            <Box mb={2}>
              <>
                {isHuman ? (
                  <TextField
                    label="メッセージを入力"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
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
                        backgroundColor: isMyTurn ? "primary.main" : "grey.300",
                        color: isMyTurn ? "white" : "grey.500",
                        "&:hover": {
                          backgroundColor: isMyTurn
                            ? "primary.dark"
                            : "grey.300",
                        },
                        transition:
                          "background-color 0.3s ease, color 0.3s ease",
                      }}
                    >
                      {isGenerating ? "生成中..." : "メッセージ生成"}
                    </Button>
                  </Box>
                )}
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
                    message.trim() === ""
                  }
                  sx={{
                    backgroundColor:
                      remainTurn > 0 &&
                      isMyTurn &&
                      message.trim() !== "" &&
                      !loading
                        ? "primary.main"
                        : "grey.300",
                    color:
                      remainTurn > 0 &&
                      isMyTurn &&
                      message.trim() !== "" &&
                      !loading
                        ? "white"
                        : "grey.500",
                    "&:hover": {
                      backgroundColor:
                        remainTurn > 0 &&
                        isMyTurn &&
                        message.trim() !== "" &&
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
                    "送信"
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
                <FormLabel component="legend">相手を選択</FormLabel>
                <RadioGroup
                  value={
                    answer.select !== null ? String(answer.select) : undefined
                  }
                  onChange={(e) =>
                    setAnswer((prevAnswer) => ({
                      ...prevAnswer,
                      select: e.target.value === "true",
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
                  {isSubmitted ? "送信完了" : "送信"}
                </Button>
              </Box>
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
