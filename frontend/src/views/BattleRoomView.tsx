// frontend/src/views/BattleRoomView.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BotData,
  PlayerData,
  BattleRules,
  BattleRoomData,
} from "../shared/types.ts";
import { BattleViewProps } from "./BattleView.tsx";
import {
  onGeneratedTopic,
  onPlayerPrepared,
  preparationComplete,
  updateBattleRoom,
  updatePrivateBattleData,
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
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { generateTopic } from "../services/chatGPT_f.ts";
import { appPaths } from "../App.tsx";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

export interface OnlineRoomViewProps {
  battleData: BattleRoomData;
  botData: BotData;
}

const BattleRoomView: React.FC = () => {
  //#region init
  const location = useLocation();
  const { battleData, botData } = location.state as OnlineRoomViewProps;
  const [battleRules, setBattleRules] = useState<BattleRules>(
    battleData.battleRule
  );
  const battleId = battleData.battleId;
  const myId = auth.currentUser?.uid ?? "";

  const myKey =
    Object.keys(battleData.players).find(
      (key) => battleData.players[key].id === myId
    ) ?? "";

  const [players, setPlayers] = useState<PlayerData[]>(
    Object.values(battleData.players)
  );
  const navigate = useNavigate();
  const [selectedIsHuman, setSelectedIsHuman] = useState<boolean>(true);
  const [selectedBotId, setSelectedBotId] = useState<number>(botData.defaultId);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(120); // 例: 準備時間120秒
  const [isBattleStarting, setIsBattleStarting] = useState<boolean>(false);
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
    preparationComplete(battleId, myKey);
  };

  // 他プレイヤーの準備完了を監視
  useEffect(() => {
    const unsubscribe = onPlayerPrepared(battleId, (result) => {
      if (result) {
        console.log("preparations updated:", result);
        setPlayers(Object.values(result));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [battleId]);

  // すべてのプレイヤーが準備完了になったらカウントダウン開始
  useEffect(() => {
    if (players.every((player) => player.isReady)) {
      setIsBattleStarting(true);
      const prepareBattle = async () => {
        if (battleData.hostId === myId) {
          await generateTopic(battleId);
          const data = {
            status: "started",
            timestamps: { start: Date.now() },
          };
          await updateBattleRoom(battleId, data);
        }
        const unsubscribe = onGeneratedTopic(battleId, (topic) => {
          setBattleRules((prev) => ({ ...prev, topic: topic }));
        });
        await updatePrivateBattleData(
          battleId,
          myId,
          selectedIsHuman,
          selectedIsHuman === false && selectedBotId !== null
            ? (botData.data.find((bot) => bot.id === selectedBotId) ?? null)
            : null
        );
        return () => {
          unsubscribe();
        };
      };
      prepareBattle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players]);

  useEffect(() => {
    if (battleRules.topic !== "") {
      toBattleViewSegue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleRules.topic]);

  useEffect(() => {
    if (isBattleStarting) {
      //ぐるぐる
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBattleStarting]);
  //#endregion

  //#region バトル画面遷移
  // バトル画面に遷移する関数
  const toBattleViewSegue = async () => {
    const props: BattleViewProps = {
      battleData: {
        battleId: battleId,
        battleRule: battleRules,
        players: {
          ...battleData.players,
          [myKey]: {
            ...battleData.players[myKey],
            isHuman: selectedIsHuman,
          },
        },
        chatData: battleData.chatData,
        status: battleData.status,
        hostId: battleData.hostId,
        submitAnswer: [],
        battleResult: [],
        timestamps: {
          start: 0,
          end: 0,
        },
      },
      isHuman: selectedIsHuman,
      bot:
        selectedIsHuman === false && selectedBotId !== null
          ? (botData.data.find((bot) => bot.id === selectedBotId) ?? null)
          : null,
    };
    navigate(appPaths.BattleView(battleId), { state: props });
  };

  const toHomeViewSegue = () => {
    navigate(appPaths.HomeView);
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
            ランダムマッチ ルーム
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box mt={4}>
          {/* カウントダウン中の表示 */}
          {isBattleStarting ? (
            <Box textAlign="center" mt={8}>
              <Typography variant="h4" gutterBottom>
                まもなくバトルが始まります。
              </Typography>
              <CircularProgress size={24} />
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
                          onChange={
                            (e) =>
                              setSelectedIsHuman(e.target.value === "human") // "human" を boolean に変換
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
                      ターン数: {battleData.battleRule.maxTurn} ターン
                    </Typography>
                    <Typography variant="body1">
                      1ターンの時間: {battleData.battleRule.oneTurnTime} 秒
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

export default BattleRoomView;
