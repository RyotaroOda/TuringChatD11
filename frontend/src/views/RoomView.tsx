// frontend/src/views/RoomView.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RoomData, BotData, PlayerData, AIModel } from "../shared/types.ts";
import { BattleViewProps } from "./BattleView.tsx";
import {
  onPlayerPrepared,
  preparationComplete,
} from "../services/firebase-realtime-database.ts";
import { auth } from "../services/firebase_f.ts";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Grid,
  InputLabel,
  ListItemIcon,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

export interface OnlineRoomViewProps {
  roomData: RoomData;
  botData: BotData;
}

const RoomView: React.FC = () => {
  //#region init
  const location = useLocation();
  const { roomData, botData } = location.state as OnlineRoomViewProps;
  const roomId = roomData.roomId;
  const myId = auth.currentUser?.uid ?? "";

  const myKey =
    Object.keys(roomData.players).find(
      (key) => roomData.players[key].id === myId
    ) ?? "";

  const [players, setPlayers] = useState<PlayerData[]>(
    Object.values(roomData.players)
  );
  const navigate = useNavigate();
  const [selectedIsHuman, setSelectedIsHuman] = useState<boolean>(true);
  const [selectedBotId, setSelectedBotId] = useState<number | null>(
    botData.defaultId
  );
  const [isReady, setIsReady] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(120); // 例: 準備時間120秒
  const [countdown, setCountdown] = useState<number | null>(null);
  //#endregion

  // タイマー処理
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    if (timeLeft === 0) {
      // handleForceReady();
      toHomeViewSegue();
    }

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  //#region プレイヤー準備
  // プレイヤーの準備をクリック
  const handleReadyClick = () => {
    if (selectedIsHuman === false && selectedBotId === null) {
      alert("AIボットを選択してください。");
      return;
    }
    setIsReady(true);
    preparationComplete(roomId, myKey);
  };

  // // 準備時間が切れた際に自動的に準備完了にする
  // const handleForceReady = () => {
  //   if (!isReady) {
  //     if (
  //       selectedIsHuman === false &&
  //       selectedBotId === null &&
  //       botData.data.length > 0
  //     ) {
  //       setSelectedBotId(botData.defaultId);
  //     }
  //     setIsReady(true);
  //     preparationComplete(roomId, myKey);
  //   }
  // };

  // 他プレイヤーの準備完了を監視
  useEffect(() => {
    const unsubscribe = onPlayerPrepared(roomId, (result) => {
      if (result) {
        console.log("preparations updated:", result);
        setPlayers(Object.values(result));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  // // すべてのプレイヤーが準備完了になったらバトルビューに遷移
  // useEffect(() => {
  //   if (players.every((player) => player.isReady)) {
  //     toBattleViewSegue();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [players]);

  // すべてのプレイヤーが準備完了になったらカウントダウン開始
  useEffect(() => {
    if (players.every((player) => player.isReady)) {
      setCountdown(5); // 5秒カウントダウンを設定
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players]);

  // カウントダウン処理
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const countdownTimer = setInterval(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);

      return () => clearInterval(countdownTimer);
    } else if (countdown === 0) {
      toBattleViewSegue();
    }
  }, [countdown]);

  //#endregion

  //#region バトル画面遷移
  // バトル画面に遷移する関数
  const toBattleViewSegue = () => {
    const props: BattleViewProps = {
      roomId: roomData.roomId,
      roomData: roomData,
      isHuman: selectedIsHuman,
      bot:
        selectedIsHuman === false && selectedBotId !== null
          ? (botData.data.find((bot) => bot.id === selectedBotId) ?? null)
          : null,
    };
    navigate(`/${roomData.roomId}/battle`, { state: props });
  };

  const toHomeViewSegue = () => {
    navigate("/");
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
            ルームID: {roomData.roomId}
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box mt={4}>
          {/* カウントダウン中の表示 */}
          {countdown !== null ? (
            <Box textAlign="center" mt={8}>
              <Typography variant="h4" gutterBottom>
                バトル開始まで {countdown} 秒
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={4}>
              {/* バトル準備 */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      バトル準備
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      残り時間: {timeLeft} 秒
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(timeLeft / 120) * 100}
                    />
                    <Box mt={2}>
                      <FormControl component="fieldset">
                        <FormLabel component="legend">
                          プレイモードを選択
                        </FormLabel>
                        <RadioGroup
                          value={selectedIsHuman ? "human" : "ai"}
                          onChange={(e) =>
                            setSelectedIsHuman(e.target.value === "human")
                          }
                        >
                          <FormControlLabel
                            value="human"
                            control={<Radio />}
                            label="自分でプレイする"
                          />
                          <FormControlLabel
                            value="ai"
                            control={<Radio />}
                            label="AIがプレイする"
                          />
                        </RadioGroup>
                      </FormControl>
                    </Box>
                    {selectedIsHuman === false && (
                      <Box mt={2}>
                        <FormControl fullWidth>
                          <InputLabel>使用するAIボット</InputLabel>
                          <Select
                            value={selectedBotId ?? ""}
                            onChange={(e) =>
                              setSelectedBotId(Number(e.target.value))
                            }
                          >
                            {botData.data.map((bot) => (
                              <MenuItem key={bot.id} value={bot.id}>
                                {bot.name} ({bot.model})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                    <Box mt={4}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleReadyClick}
                        disabled={isReady}
                        fullWidth
                      >
                        {isReady ? "待機中..." : "準備完了"}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* バトル設定 */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      バトルルール
                    </Typography>
                    <Typography variant="body1">
                      ターン数: {roomData.battleConfig.maxTurn} ターン
                    </Typography>
                    <Typography variant="body1">
                      1ターンの時間: {roomData.battleConfig.oneTurnTime} 秒
                    </Typography>
                  </CardContent>
                </Card>

                {/* プレイヤー一覧 */}
                <Box mt={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        プレイヤー一覧
                      </Typography>
                      <List>
                        {players.map((player) => (
                          <ListItem key={player.id}>
                            {player.isReady && (
                              <ListItemIcon>
                                <CheckCircleIcon color="primary" />
                              </ListItemIcon>
                            )}
                            <ListItemText
                              primary={player.name}
                              secondary={
                                player.isReady ? "準備完了！" : "準備中..."
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default RoomView;
