// frontend/src/views/HomeView.tsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBattleRoomData,
  onMatched,
} from "../API/firebase-realtime-database.ts";
import {
  requestMatch,
  cancelRequest,
} from "../API/firebase-functions-client.ts";
import { signInAnonymously, updateProfile } from "firebase/auth";
import { auth } from "../API/firebase_f.ts";
import {
  AIModel,
  BotData,
  GPTMessage,
  PlayerData,
  ProfileData,
} from "../shared/types.ts";
import {
  getUserProfile,
  updateUserProfile,
} from "../API/firestore-database_f.ts";
import { OnlineRoomViewProps } from "./BattleRoomView.tsx";
import PromptGenerator from "../components/PromptGenerator.tsx";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  Container,
  Box,
  CircularProgress,
  CssBaseline,
  Card,
  ButtonGroup,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stepper,
  StepLabel,
  Step,
  IconButton,
  Avatar,
  Drawer,
  Fab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Slide,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import { appPaths, variables } from "../App.tsx";
import CopyrightIcon from "@mui/icons-material/Copyright";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import StarIcon from "@mui/icons-material/Star";
import CodeIcon from "@mui/icons-material/Code";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import { Add as AddIcon } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ChatIcon from "@mui/icons-material/Chat";
import Fade from "@mui/material/Fade";
import CheckIcon from "@mui/icons-material/Check";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { Difficulty, SingleBattleViewProps } from "./SingleBattleView.tsx";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [aiPrompt, setAiPrompt] = useState<string>(variables.defaultPrompt);
  const [selectedIsHuman, setSelectedIsHuman] = useState<boolean>(false);
  const [battleId, setBattleId] = useState<string>("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [playerId, setPlayerId] = useState<string>("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bots, setBots] = useState<BotData | null>(null);
  const [isPushedMatching, setIsPushedMatching] = useState<boolean>(false);
  const [matchingTimer, setMatchingTimer] = useState<number>(-1);
  const [battleRoomListened, setBattleRoomListened] = useState<boolean>(false);
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [singlePlayDifficulty, setSinglePlayDifficulty] =
    useState<Difficulty>("初級");
  const [openJoinRoomDialog, setOpenJoinRoomDialog] = useState(false);

  const [openTutorial, setOpenTutorial] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const [openGeneratePrompt, setOpenGeneratePrompt] = useState(false);

  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<GPTMessage[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [openSoloTutorial, setOpenSoloTutorial] = useState(false);
  const [openMatchTutorial, setOpenMatchTutorial] = useState(false);

  const steps = [
    "ゲーム概要",
    "バトルに参加する",
    "バトル準備",
    "バトル開始",
    "結果発表",
  ];

  const stepContent = [
    <>
      <Typography variant="h6">チューリングゲームとは？</Typography>
      <Typography>
        このゲームは、相手プレーヤーとチャットしながら相手が
        「人間」か「AI」かを見破るゲームです！
      </Typography>
      <Typography>
        AIになりきったり、自分なりにAIをカスタマイズしたりして、
        相手に自分の正体を悟られないようにしましょう。
      </Typography>
    </>,
    <>
      <Typography variant="h6">バトルに参加する</Typography>
      <Typography>以下のモードから選んでプレイを開始しましょう：</Typography>
      <ul>
        <li>
          <strong>ひとりであそぶ</strong>：AIプレイヤーと対戦します。
        </li>
        <li>
          <strong>だれかとあそぶ</strong>
          ：オンライン上の誰かとマッチングして対戦します。
        </li>
      </ul>
    </>,
    <>
      <Typography variant="h6">バトル準備</Typography>
      <Typography>2つのプレイモードがあります：</Typography>
      <ul>
        <li>
          <strong>自分でプレイする</strong>：あなた自身が相手とチャットします。
        </li>
        <li>
          <strong>AIがプレイする</strong>
          ：あなたがAIに指示を出し、AIが相手とチャットします。
        </li>
      </ul>
    </>,
    <>
      <Typography variant="h6">バトル開始</Typography>
      <Typography>
        システムからお題（チャットの話題）が提示されます：
      </Typography>
      <ul>
        <li>お題に沿って相手と自由にチャットしましょう。</li>
        <li>
          チャット終了後、以下を送信してください：
          <ul>
            <li>
              <strong>相手の正体</strong>（人間 or AI）
            </li>
            <li>
              <strong>そう判断した理由</strong>
            </li>
          </ul>
        </li>
      </ul>
    </>,
    <>
      <Typography variant="h6">結果発表</Typography>
      <Typography>お互いの「正体」と「理由」を答え合わせします。</Typography>
      <ul>
        <li>
          <strong>得点ルール</strong>：
          <ul>
            <li>
              相手の正体を当てたら <strong>1ポイント</strong>
            </li>
            <li>
              相手が自分の正体を間違えたら <strong>1ポイント</strong>
            </li>
          </ul>
        </li>
      </ul>
      <Typography>合計得点が高いプレイヤーが勝利です！</Typography>
    </>,
  ];

  useEffect(() => {
    const hasSeenHowToPlay = localStorage.getItem("firstPlay");
    if (!hasSeenHowToPlay) {
      setOpenTutorial(true);
      localStorage.setItem("firstPlay", "true");
    }
  }, []);

  useEffect(() => {
    if (user) {
      setPlayerId(user.uid);
      setPlayerName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      if (user) {
        const data = await getUserProfile();
        if (data) {
          setProfile(data);
          setBots(data.bots);
          setSelectedPromptId(data.bots.defaultId);
          setAiPrompt(data.bots.data[data.bots.defaultId].prompt);
          setScore(data.rating);
        } else {
          console.error("プロフィール情報の取得に失敗しました。");
        }
      }
    } catch (error) {
      console.error("プロフィール取得エラー: ", error);
    }
  };

  const handleTutorialOpen = () => setOpenTutorial(true);
  const handleTutorialClose = () => {
    setOpenTutorial(false);
    setActiveStep(0);
  };
  const handleStepNext = () => setActiveStep((prevStep) => prevStep + 1);
  const handleStepBack = () => setActiveStep((prevStep) => prevStep - 1);

  const startMatch = async () => {
    setIsPushedMatching(true);
    try {
      const player: PlayerData = {
        id: playerId,
        name: playerName,
        iconURL: user?.photoURL || "",
        isReady: false,
        rating: score,
      };
      const result = await requestMatch(player);
      if (result.battleId !== "") {
        setBattleId(result.battleId);
        setBattleRoomListened(true);
      } else {
        console.error("マッチングエラー: ", result.message);
        cancelMatching();
      }
    } catch (error) {
      console.error("マッチングエラー: ", error);
      cancelMatching();
    }
  };

  useEffect(() => {
    if (battleRoomListened) {
      setMatchingTimer(10);
    }
  }, [battleRoomListened]);

  useEffect(() => {
    if (matchingTimer > 0) {
      const timerId = setTimeout(() => {
        setMatchingTimer((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [matchingTimer]);

  const cancelMatching = async () => {
    setBattleRoomListened(false);
    setMatchingTimer(-1);
    setRoomId(null);
    setTimeout(() => setIsPushedMatching(false), 1000);
    try {
      await cancelRequest();
    } catch (error) {
      console.error("キャンセルエラー: ", error);
    }
  };

  useEffect(() => {
    if (battleRoomListened && battleId !== "") {
      const unsubscribe = onMatched(battleId, (isMatched) => {
        if (isMatched) {
          toBattleRoomViewSegue(battleId);
        }
      });
      return () => {
        unsubscribe();
        setBattleRoomListened(false);
      };
    }

    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (battleRoomListened) {
        await cancelMatching();
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [battleRoomListened, battleId]);

  const handleOpenGeneratePrompt = () => {
    setOpenGeneratePrompt(true);
  };
  const handleCloseGeneratePrompt = () => {
    const confirmClose = window.confirm(
      "編集内容が保存されていません。閉じてもよろしいですか？"
    );
    if (!confirmClose) return;

    setOpenGeneratePrompt(false);
  };
  const handleCompleteGeneratePrompt = (generatedPrompt: string) => {
    setAiPrompt(generatedPrompt);
    setOpenGeneratePrompt(false);
  };

  const handleSinglePlayChallenge = () => {
    const props: SingleBattleViewProps = {
      difficulty: singlePlayDifficulty,
      isHuman: selectedIsHuman,
      bot: {
        id: 0,
        name: "default",
        prompt: aiPrompt,
        model: AIModel["gpt-4"],
        temperature: 0,
        top_p: 0,
      },
    };
    navigate(appPaths.SingleBattleView, { state: props });
  };

  const handleCreateRoom = () => {
    // 未実装
  };
  const handleJoinRoom = () => {
    // 未実装
  };
  const handleJoinRoomConfirm = () => {
    if (roomId && roomId.trim() !== "") {
      setOpenJoinRoomDialog(false);
    } else {
      alert("ルームIDを入力してください。");
    }
  };

  const toBattleRoomViewSegue = (battleId: string) => {
    setBattleRoomListened(false);
    getBattleRoomData(battleId).then((battleData) => {
      if (
        battleData.status === "matched" &&
        battleData.players[Object.keys(battleData.players)[0]] !==
          battleData.players[Object.keys(battleData.players)[1]]
      ) {
        const props: OnlineRoomViewProps = {
          battleData: battleData,
          botData: bots
            ? bots
            : {
                defaultId: 0,
                data: [
                  {
                    id: 0,
                    name: "default",
                    prompt: aiPrompt,
                    model: AIModel["gpt-4"],
                    temperature: 0,
                    top_p: 0,
                  },
                ],
              },
        };
        navigate(appPaths.BattleRoomView(battleId), { state: props });
      } else {
        console.error("ルームに入室できませんでした。");
        cancelMatching();
        alert("ルームに入室できませんでした。");
        navigate(appPaths.HomeView);
      }
    });
  };

  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
      alert("ゲストでログインしました");
      navigate(appPaths.HomeView);
    } catch (error) {
      console.error("ゲストログインエラー: ", error);
    }
  };

  const handleProfileEditClick = () => {
    navigate(appPaths.profile_edit, { state: profile });
  };

  const handleIconGenerator = () => {
    navigate(appPaths.icon_generator, { state: profile });
  };

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const toggleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  const handleAboutGame = () => {
    navigate(appPaths.how_to_play);
  };

  const getCommentByScore = (score: number): string => {
    if (score >= 1500) {
      return "素晴らしい！あなたはトッププレイヤーです！";
    } else if (score >= 1200) {
      return "好調ですね！さらなる挑戦を！";
    } else if (score >= 900) {
      return "良い調子です！次のステージを目指しましょう！";
    } else if (score >= 600) {
      return "まだまだこれから！頑張りましょう！";
    } else {
      return "スタート地点です！チャレンジを続けて成長しましょう！";
    }
  };

  const handlePromptSelectChange = (event: SelectChangeEvent<number>) => {
    const promptId = event.target.value as number;
    setSelectedPromptId(promptId);
    if (bots) {
      setAiPrompt(bots.data[promptId].prompt);
    }
  };

  const handleSavePrompt = async () => {
    if (!user || !profile || !bots || selectedPromptId === null) return;
    const updatedBots = { ...bots };
    updatedBots.data[selectedPromptId].prompt = aiPrompt;
    try {
      await updateUserProfile({ ...profile, bots: updatedBots });
      setBots(updatedBots);
      alert("プロンプトを保存しました");
    } catch (error) {
      console.error("プロンプト保存エラー:", error);
      alert("プロンプトの保存に失敗しました");
    }
  };

  const xsSize = 12;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {user ? (
        <>
          {/* ヘッダー */}
          <AppBar position="static">
            <Toolbar>
              <Typography
                variant="h6"
                sx={{
                  flexGrow: 1,
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                チューリングゲーム
              </Typography>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleAboutGame}
                sx={{ whiteSpace: "nowrap", ml: 2 }}
              >
                このゲームについて
              </Button>
            </Toolbar>
          </AppBar>

          {/* メインコンテンツ */}
          <Container maxWidth="lg" sx={{ mt: 4, pb: 8 }}>
            <Grid container spacing={2} alignItems="stretch">
              {/* プロフィール情報 */}
              <Grid
                item
                xs={xsSize}
                sm={6}
                md={6}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Card
                  sx={{
                    padding: 4,
                    borderRadius: 2,
                    boxShadow: 3,
                    mb: 2,
                    flex: 1,
                  }}
                >
                  <Box
                    textAlign="center"
                    mb={2}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {photoURL ? (
                      <IconButton onClick={handleIconGenerator}>
                        <Avatar
                          src={photoURL}
                          alt={user?.displayName || "Guest"}
                          sx={{ width: 40, height: 40, mr: 2 }}
                        />
                      </IconButton>
                    ) : (
                      <IconButton onClick={handleIconGenerator}>
                        <AccountCircleIcon
                          sx={{ width: 40, height: 40, mr: 2, color: "gray" }}
                        />
                      </IconButton>
                    )}
                    <Typography variant="h6" color="text.primary">
                      {playerName}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleProfileEditClick}
                  >
                    プロフィール編集
                  </Button>
                </Card>
              </Grid>

              {/* スコア表示 */}
              <Grid
                item
                xs={xsSize}
                sm={6}
                md={6}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Card
                  sx={{
                    padding: 4,
                    borderRadius: 2,
                    boxShadow: 3,
                    mb: 2,
                    flex: 1,
                  }}
                >
                  <Box mb={2}>
                    <Typography variant="h5" color="text.primary" gutterBottom>
                      <StarIcon
                        color="primary"
                        fontSize="large"
                        sx={{ verticalAlign: "middle", mr: 1 }}
                      />
                      スコア
                    </Typography>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: "bold",
                          mr: 1,
                          color: "primary.main",
                        }}
                      >
                        {score}
                      </Typography>
                      <EmojiEvents
                        fontSize="large"
                        sx={{ color: "primary.main" }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, fontStyle: "italic", textAlign: "center" }}
                    >
                      {getCommentByScore(score)}
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              {/* バトル */}
              <Grid item xs={12} sm={12} md={12}>
                <Card
                  sx={{
                    padding: 3,
                    borderRadius: 2,
                    boxShadow: 3,
                    mb: 2,
                    flex: 1,
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="h5" color="text.primary" gutterBottom>
                      <SportsEsportsIcon
                        color="primary"
                        fontSize="large"
                        sx={{ verticalAlign: "middle", mr: 1 }}
                      />
                      バトル
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleTutorialOpen}
                      startIcon={<HelpOutlineIcon />}
                    >
                      遊び方
                    </Button>
                  </Box>

                  <Grid container spacing={2} sx={{ mt: 0 }}>
                    {/* ひとりであそぶ */}
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={6}
                      sx={{ display: "flex", flexDirection: "column" }}
                    >
                      <Card
                        sx={{
                          padding: 3,
                          borderRadius: 2,
                          boxShadow: 1,
                          flex: 1,
                        }}
                      >
                        <Box display="flex" justifyContent="space-between">
                          <Typography
                            variant="h6"
                            color="text.primary"
                            gutterBottom
                          >
                            <PersonIcon
                              color="primary"
                              fontSize="large"
                              sx={{ verticalAlign: "middle", mr: 1 }}
                            />
                            ひとりであそぶ
                          </Typography>
                          <IconButton onClick={() => setOpenSoloTutorial(true)}>
                            <InfoOutlinedIcon />
                          </IconButton>
                        </Box>
                        <Box mt={2}>
                          <FormControl component="fieldset">
                            <FormLabel component="legend">
                              プレイモードを選択
                            </FormLabel>
                            <RadioGroup
                              value={selectedIsHuman ? "human" : "ai"}
                              onChange={(e) => {
                                setSelectedIsHuman(e.target.value === "human");
                              }}
                            >
                              <Tooltip title="AIがメッセージを生成してゲームを進めます。">
                                <FormControlLabel
                                  value="ai"
                                  control={<Radio />}
                                  label="AIプレイモード"
                                />
                              </Tooltip>
                              <Tooltip title="あなた自身がAIのふりをしてゲームを進めます。">
                                <FormControlLabel
                                  value="human"
                                  control={<Radio />}
                                  label="手動プレイモード"
                                />
                              </Tooltip>
                            </RadioGroup>
                          </FormControl>
                        </Box>

                        <ButtonGroup fullWidth sx={{ mt: 2 }}>
                          <Button
                            onClick={() => setSinglePlayDifficulty("初級")}
                            variant={
                              singlePlayDifficulty === "初級"
                                ? "contained"
                                : "outlined"
                            }
                          >
                            初級
                          </Button>
                          <Button
                            onClick={() => setSinglePlayDifficulty("中級")}
                            variant={
                              singlePlayDifficulty === "中級"
                                ? "contained"
                                : "outlined"
                            }
                          >
                            中級
                          </Button>
                          <Button
                            onClick={() => setSinglePlayDifficulty("上級")}
                            variant={
                              singlePlayDifficulty === "上級"
                                ? "contained"
                                : "outlined"
                            }
                          >
                            上級
                          </Button>
                        </ButtonGroup>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          sx={{ mt: 3 }}
                          onClick={handleSinglePlayChallenge}
                        >
                          挑戦する
                        </Button>
                      </Card>
                    </Grid>

                    {/* だれかとあそぶ */}
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={6}
                      sx={{ display: "flex", flexDirection: "column" }}
                    >
                      <Card
                        sx={{
                          padding: 3,
                          borderRadius: 2,
                          boxShadow: 1,
                          flex: 1,
                        }}
                      >
                        <Box display="flex" justifyContent="space-between">
                          <Typography
                            variant="h6"
                            color="text.primary"
                            gutterBottom
                          >
                            <GroupIcon
                              color="primary"
                              fontSize="large"
                              sx={{ verticalAlign: "middle", mr: 1 }}
                            />
                            だれかとあそぶ
                          </Typography>
                          <IconButton
                            onClick={() => setOpenMatchTutorial(true)}
                          >
                            <InfoOutlinedIcon />
                          </IconButton>
                        </Box>

                        <Typography
                          variant="subtitle1"
                          color="text.primary"
                          gutterBottom
                          sx={{ mt: 2 }}
                        >
                          ランダムマッチ
                        </Typography>
                        {isPushedMatching ? (
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={cancelMatching}
                            fullWidth
                            sx={{ mt: 1 }}
                            disabled={!battleRoomListened}
                          >
                            キャンセル
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={startMatch}
                            fullWidth
                            sx={{ mt: 1 }}
                            disabled={isPushedMatching}
                          >
                            マッチング開始
                          </Button>
                        )}
                        {battleRoomListened && (
                          <Box
                            mt={2}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexDirection={xsSize === 12 ? "column" : "row"}
                          >
                            <Box
                              mt={2}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Typography variant="body1" sx={{ ml: 0 }}>
                                マッチング中...
                              </Typography>
                              <CircularProgress size={24} sx={{ ml: 2 }} />
                            </Box>
                          </Box>
                        )}

                        <Divider sx={{ mt: 4, mb: 4 }} />

                        {/* プライベートルーム（未実装） */}
                        <Typography
                          variant="subtitle1"
                          color="text.primary"
                          gutterBottom
                        >
                          プライベートルーム
                        </Typography>
                        <Box
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          sx={{ mt: 2 }}
                          gap={2}
                        >
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCreateRoom}
                            fullWidth
                            disabled
                          >
                            ルームを作る
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleJoinRoom}
                            fullWidth
                            disabled
                          >
                            ルームに入る
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              {/* AIプロンプト */}
              <Grid item xs={12} sm={12} md={12}>
                <Card
                  sx={{
                    padding: 4,
                    borderRadius: 2,
                    boxShadow: 3,
                    mb: 4,
                    flex: 1,
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="h5" color="text.primary" gutterBottom>
                      <CodeIcon
                        color="primary"
                        fontSize="large"
                        sx={{ verticalAlign: "middle", mr: 1 }}
                      />
                      AIプロンプト
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleOpenGeneratePrompt}
                      startIcon={<AutoAwesomeIcon />}
                    >
                      テンプレートから作成
                    </Button>
                  </Box>

                  {bots && (
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel id="prompt-select-label">
                        使用中のプロンプト
                      </InputLabel>
                      <Select
                        labelId="prompt-select-label"
                        value={
                          selectedPromptId !== null
                            ? selectedPromptId
                            : bots.defaultId
                        }
                        label="使用中のプロンプト"
                        onChange={handlePromptSelectChange}
                      >
                        {bots.data.map((bot) => (
                          <MenuItem key={bot.id} value={bot.id}>
                            {bot.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <TextField
                    label="AIへの命令を入力してください。"
                    multiline
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    fullWidth
                    sx={{ mt: 2 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={handleSavePrompt}
                    disabled={!bots || selectedPromptId === null}
                  >
                    保存
                  </Button>
                </Card>
              </Grid>
            </Grid>
          </Container>

          {/* ルームID入力ダイアログ */}
          <Dialog
            open={openJoinRoomDialog}
            onClose={() => setOpenJoinRoomDialog(false)}
          >
            <DialogTitle>ルームに入る</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="ルームID"
                type="text"
                fullWidth
                value={roomId || ""}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenJoinRoomDialog(false)}>
                キャンセル
              </Button>
              <Button onClick={handleJoinRoomConfirm}>参加</Button>
            </DialogActions>
          </Dialog>

          {/* チュートリアルダイアログ */}
          <Dialog
            open={openTutorial}
            onClose={handleTutorialClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                width: "800px",
                height: "500px",
                padding: 2,
                borderRadius: 8,
              },
            }}
          >
            <DialogTitle>
              <MenuBookIcon
                fontSize="large"
                sx={{ verticalAlign: "middle", mr: 1 }}
              />
              チュートリアル
            </DialogTitle>
            <DialogContent>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Box sx={{ mt: 3 }}>{stepContent[activeStep]}</Box>
            </DialogContent>
            <DialogActions>
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <IconButton
                  onClick={handleStepBack}
                  disabled={activeStep === 0}
                  color="primary"
                >
                  <ArrowBackIcon />
                </IconButton>
                {activeStep < steps.length - 1 ? (
                  <IconButton onClick={handleStepNext} color="primary">
                    <ArrowForwardIcon />
                  </IconButton>
                ) : (
                  <IconButton onClick={handleTutorialClose} color="success">
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>
            </DialogActions>
          </Dialog>

          {/* 「ひとりであそぶ」情報ダイアログ */}
          <Dialog
            open={openSoloTutorial}
            onClose={() => setOpenSoloTutorial(false)}
          >
            <DialogTitle>「ひとりであそぶ」のチュートリアル</DialogTitle>
            <DialogContent>
              <Typography>
                シングルプレイの概要です。難易度を選んでAIと対戦することができます。
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenSoloTutorial(false)}>閉じる</Button>
            </DialogActions>
          </Dialog>

          {/* 「だれかとあそぶ」情報ダイアログ */}
          <Dialog
            open={openMatchTutorial}
            onClose={() => setOpenMatchTutorial(false)}
          >
            <DialogTitle>「だれかとあそぶ」のチュートリアル</DialogTitle>
            <DialogContent>
              <Typography>
                ランダムマッチでオンラインの相手と対戦します。マッチング開始を押して相手を待ちましょう。
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenMatchTutorial(false)}>
                閉じる
              </Button>
            </DialogActions>
          </Dialog>

          {/* プロンプト生成ツールダイアログ */}
          <Dialog
            open={openGeneratePrompt}
            onClose={handleCloseGeneratePrompt}
            fullWidth
            maxWidth="md"
            BackdropProps={{
              sx: {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                transition: "opacity 0.5s ease",
              },
            }}
            TransitionComponent={Fade}
            transitionDuration={500}
            PaperProps={{
              sx: {
                borderRadius: 4,
                backgroundColor: "#fafafa",
              },
            }}
          >
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#2196f3",
                color: "#ffffff",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                padding: "16px 24px",
              }}
            >
              <SmartToyIcon sx={{ mr: 1 }} />
              プロンプト生成ツール
            </DialogTitle>
            <DialogContent
              dividers
              sx={{
                backgroundColor: "#ffffff",
                padding: 3,
                boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              <PromptGenerator
                onClose={() => setOpenGeneratePrompt(false)}
                onComplete={handleCompleteGeneratePrompt}
                initialPrompt={aiPrompt === "未設定" ? "" : aiPrompt}
              />
            </DialogContent>
          </Dialog>

          {/* フローティングボタン - テストチャット */}
          <Fab
            color="primary"
            aria-label="チャット"
            sx={{ position: "fixed", bottom: 100, right: 16, zIndex: 1300 }}
            onClick={() => toggleDrawer(true)}
          >
            <ChatIcon />
          </Fab>

          {/* テストチャット用Drawer */}
          <Drawer
            anchor="right"
            open={isDrawerOpen}
            onClose={() => toggleDrawer(false)}
            transitionDuration={500}
            sx={{
              "& .MuiDrawer-paper": {
                transition: "transform 0.5s ease-in-out",
              },
            }}
          >
            <Slide
              direction="left"
              in={isDrawerOpen}
              mountOnEnter
              unmountOnExit
            >
              <Box
                sx={{
                  width: 400,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
                role="presentation"
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                  sx={{ borderBottom: "1px solid #ccc", pb: 1 }}
                >
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    テストチャット
                  </Typography>
                  <IconButton onClick={() => toggleDrawer(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    border: "1px solid #ccc",
                    borderRadius: 2,
                    padding: 2,
                    backgroundColor: "#f9f9f9",
                    "&::-webkit-scrollbar": {
                      width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "#f0f0f0",
                      borderRadius: "10px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#c0c0c0",
                      borderRadius: "10px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: "#a0a0a0",
                    },
                  }}
                >
                  <List>
                    {chatHistory.map((message, index) => (
                      <React.Fragment key={index}>
                        <ListItem
                          sx={{
                            alignItems: "flex-start",
                            backgroundColor:
                              message.role === "user" ? "#e3f2fd" : "#f1f8e9",
                            borderRadius: 2,
                            mb: 1,
                            boxShadow: 1,
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                backgroundColor:
                                  message.role === "user"
                                    ? "#2196f3"
                                    : "#8bc34a",
                              }}
                            >
                              {message.role === "user" ? (
                                photoURL ? (
                                  <Avatar src={photoURL} alt="User Avatar" />
                                ) : (
                                  <PersonIcon />
                                )
                              ) : (
                                <SmartToyIcon />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: "bold",
                                  color:
                                    message.role === "user"
                                      ? "#0d47a1"
                                      : "#33691e",
                                }}
                              >
                                {message.role === "user" ? "あなた" : "ボット"}
                              </Typography>
                            }
                            secondary={message.content}
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                    {isSending && (
                      <ListItem>
                        <CircularProgress size={24} />
                        <ListItemText
                          primary="応答を生成中..."
                          sx={{ ml: 2 }}
                        />
                      </ListItem>
                    )}
                    <div ref={chatEndRef} />
                  </List>
                </Box>

                <Box display="flex" mt={2} alignItems="stretch">
                  <TextField
                    label="メッセージを入力"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    sx={{
                      backgroundColor: "#ffffff",
                      borderRadius: 1,
                      boxShadow: 1,
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      if (chatMessage.trim() !== "") {
                        const userMessage: GPTMessage = {
                          role: "user",
                          content: chatMessage,
                        };
                        setChatHistory((prev) => [...prev, userMessage]);
                        setChatMessage("");
                        setIsSending(true);
                      }
                    }}
                    disabled={isSending || !chatMessage.trim()}
                    sx={{
                      ml: 2,
                      height: "auto",
                      alignSelf: "center",
                      py: 2,
                    }}
                    endIcon={<SendIcon />}
                  >
                    送信
                  </Button>
                </Box>
              </Box>
            </Slide>
          </Drawer>

          {/* フッター */}
          <AppBar
            position="fixed"
            sx={{
              top: "auto",
              bottom: 0,
              backgroundColor: "primary.main",
              padding: 1,
            }}
          >
            <Toolbar sx={{ justifyContent: "center", gap: 2 }}>
              <CopyrightIcon fontSize="small" />
              <Typography variant="body2" color="inherit">
                <strong>2024 RyotaroOda @ WashizakiUbayashi Lab</strong>
              </Typography>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate(appPaths.impression_edit)}
                sx={{ ml: 2 }}
              >
                フィードバックを送信
              </Button>
            </Toolbar>
          </AppBar>
        </>
      ) : (
        /* ログイン画面 */
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          mt={12}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate(appPaths.login)}
            sx={{
              width: "80%",
              maxWidth: "300px",
              mb: 2,
              textTransform: "none",
              fontSize: "1rem",
            }}
          >
            ログイン
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={handleAnonymousLogin}
            sx={{
              width: "80%",
              maxWidth: "300px",
              textTransform: "none",
              fontSize: "1rem",
            }}
          >
            ゲストアカウントでプレイ
          </Button>
        </Box>
      )}
    </ThemeProvider>
  );
};

export default HomeView;
