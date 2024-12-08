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
import { signInAnonymously, signOut, updateProfile } from "firebase/auth";
import { auth } from "../API/firebase_f.ts";
import {
  AIModel,
  BotData,
  GPTMessage,
  PlayerData,
  ProfileData,
} from "../shared/types.ts";
import { getUserProfile } from "../API/firestore-database_f.ts";
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
import { generateTestMessage } from "../API/chatGPT_f.ts";
import ChatIcon from "@mui/icons-material/Chat";
import Fade from "@mui/material/Fade";
import CheckIcon from "@mui/icons-material/Check";

// カスタムフォントの適用
const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

const HomeView: React.FC = () => {
  //#region init
  const navigate = useNavigate();
  const user = auth.currentUser;

  // State variables
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
  const [newName, setNewName] = useState<string>("");
  const [isPushedMatching, setIsPushedMatching] = useState<boolean>(false);
  const [battleRoomListened, setBattleRoomListened] = useState<boolean>(false);
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [singlePlayDifficulty, setSinglePlayDifficulty] = useState<
    "初級" | "中級" | "上級"
  >("初級");
  const [openJoinRoomDialog, setOpenJoinRoomDialog] = useState(false);

  //#endregion

  useEffect(() => {
    // 初回訪問チェック
    const hasSeenHowToPlay = localStorage.getItem("firstPlay");
    if (!hasSeenHowToPlay) {
      setOpenTutorial(true);
      localStorage.setItem("firstPlay", "true");
    }
  }, []);

  //#region ログイン状態の確認とプロフィール取得
  useEffect(() => {
    if (user) {
      setPlayerId(user.uid);
      if (user.isAnonymous) {
        setNewName("ゲスト");
        setPlayerName("ゲスト");
      } else {
        setPlayerName(user.displayName || "");
        setPhotoURL(user.photoURL || "");
        fetchUserProfile();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (newName !== playerName) {
    }
  }, [newName]);

  const fetchUserProfile = async () => {
    try {
      if (user) {
        const data = await getUserProfile();
        if (data) {
          setProfile(data);
        } else {
          console.error("プロフィール情報の取得に失敗しました。");
        }
      }
    } catch (error) {
      console.error("プロフィール取得エラー: ", error);
    }
  };

  useEffect(() => {
    if (profile) {
      setBots(profile.bots);
      setAiPrompt(profile.bots.data[profile.bots.defaultId].prompt);
      setScore(profile.rating);
    }
  }, [profile]);
  //#endregion

  //#region プレイヤーネームの変更(ゲストユーザー用)
  const handleNameChangeClick = () => {
    handleNameSubmit();
  };

  const handleNameSubmit = async () => {
    if (user && newName) {
      try {
        await updateProfile(user, { displayName: newName });
        setPlayerName(newName);
      } catch (error) {
        console.error("名前の更新に失敗しました: ", error);
      }
    }
  };
  //#endregion

  //スコア表示
  const getCommentByScore = (score: number): string => {
    if (score >= 1500) {
      return "素晴らしい！あなたはトッププレイヤーです！";
    } else if (score >= 12) {
      return "好調ですね！さらなる挑戦を！";
    } else if (score >= 900) {
      return "良い調子です！次のステージを目指しましょう！";
    } else if (score >= 600) {
      return "まだまだこれから！頑張りましょう！";
    } else {
      return "スタート地点です！チャレンジを続けて成長しましょう！";
    }
  };

  // プロンプトが選択されたときのハンドラー
  const handlePromptChange = (event: SelectChangeEvent<number>) => {
    const promptId = event.target.value as number;
    setSelectedPromptId(promptId);
    if (bots) {
      setAiPrompt(bots.data[promptId].prompt);
    }
  };

  //#region マッチング処理
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

  const cancelMatching = async () => {
    setBattleRoomListened(false);
    setRoomId(null);
    setTimeout(() => setIsPushedMatching(false), 1000); // 1秒後に再び有効化
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
          console.log("マッチング成立");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleRoomListened, battleId]);
  //#endregion

  //#region チュートリアルダイアログ
  const [openTutorial, setOpenTutorial] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const handleTutorialOpen = () => setOpenTutorial(true);
  const handleTutorialClose = () => {
    setOpenTutorial(false);
    setActiveStep(0); // Reset stepper when dialog is closed
  };

  const handleStepNext = () => setActiveStep((prevStep) => prevStep + 1);
  const handleStepBack = () => setActiveStep((prevStep) => prevStep - 1);

  const steps = [
    "ゲーム概要",
    "バトルに参加する",
    "バトル準備",
    "バトル開始",
    "結果発表",
  ];

  const stepContent = [
    // Step 0: ゲーム概要
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
    // Step 1: バトルに参加する
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
    // Step 2: バトル準備
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
    // Step 3: バトル開始
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
    // Step 4: 結果発表
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

  //#endregion

  //#region プロンプト編集ダイアログ
  const [openGeneratePrompt, setOpenGeneratePrompt] = useState(false);

  const handleOpenGeneratePrompt = () => {
    //? なぜかハンドル経由しないとうまくいかない
    setOpenGeneratePrompt(true);
  };

  const handleCloseGeneratePrompt = () => {
    const confirmClose = window.confirm(
      "編集内容が保存されていません。閉じてもよろしいですか？"
    );
    if (!confirmClose) return;

    setOpenGeneratePrompt(false);
  };

  // プロンプトが完成したときの処理
  const handleCompleteGeneratePrompt = (generatedPrompt) => {
    setAiPrompt(generatedPrompt); // 完成したプロンプトを保存
    console.log("プロンプトを更新:", aiPrompt); // 必要に応じてログ出力
    setOpenGeneratePrompt(false);
  };

  //#endregion

  //#region シングルプレイ
  const handleSinglePlayChallenge = () => {
    // シングルプレイのゲーム画面に遷移（仮のパス）
    const props = {
      difficulty: singlePlayDifficulty,
    };
    // navigate(appPaths.single_play_game, { state: props });
  };

  //#endregion

  //#region プライベートルーム
  const handleCreateRoom = () => {
    // ルーム作成のロジックを実装
  };

  const handleJoinRoom = () => {
    if (roomId && roomId.trim() === "") {
      alert("ルームIDを入力してください。");
      return;
    }
    // ルームに入るロジックを実装
  };
  const handlePrivateRoom = () => {
    // プライベートルームの作成または参加画面に遷移（仮のパス）
    // navigate(appPaths.private_room);
  };

  // const toRoomViewSegue = (roomId: string) => {
  //   setBattleRoomListened(false);
  //   getRoomData(roomId).then((roomData) => {
  //     const battleData = roomData.battleData[battleId.battleRoomId];
  //     if (roomData.status === "matched") {
  //       if (user && user.isAnonymous) {
  //         // ゲストユーザーの場合はデフォルトのAIを使用
  //         const props: OnlineRoomViewProps = {
  //           battleData: battleData,
  //           botData: {
  //             defaultId: 0,
  //             data: [
  //               {
  //                 id: 0,
  //                 name: "default",
  //                 prompt: aiPrompt,
  //                 model: AIModel["gpt-4"],
  //                 temperature: 0,
  //                 top_p: 0,
  //               },
  //             ],
  //           },
  //         };
  //         navigate(appPaths.BattleRoomView(battleId), {
  //           state: props,
  //         });
  //       } else if (bots) {
  //         // プレイヤーの場合はプロフィールのAIを使用
  //         const props: OnlineRoomViewProps = {
  //           battleData: battleData,
  //           botData: bots,
  //         };
  //         navigate(appPaths.RoomView(roomId), { state: props });
  //       } else {
  //         console.error("ルームに入室できませんでした。");
  //         cancelMatching();
  //       }
  //     }
  //   });
  // };

  const handleJoinRoomConfirm = () => {
    if (roomId && roomId.trim() !== "") {
      // ルームに入るロジックを実装
      setOpenJoinRoomDialog(false);
    } else {
      alert("ルームIDを入力してください。");
    }
  };
  //#endregion

  //#region チャット
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<GPTMessage[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // チャットの最後にスクロールする処理
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // メッセージを送信する処理
  const handleSendMessage = async () => {
    if (chatMessage.trim() !== "") {
      const userMessage: GPTMessage = {
        role: "user",
        content: chatMessage,
      };
      setChatHistory((prev) => [...prev, userMessage]);
      setChatMessage("");
      setIsSending(true);
    }
  };

  // メッセージ送信とAIの応答を処理するエフェクト
  useEffect(() => {
    const sendChatMessage = async () => {
      try {
        const filteredMessages = chatHistory.filter(
          (message) => message.role !== "system"
        );
        const responseContent = await generateTestMessage(filteredMessages);
        const aiMessage: GPTMessage = {
          role: "assistant",
          content: responseContent,
        };
        setChatHistory((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error generating chat response: ", error);
      } finally {
        setIsSending(false);
      }
    };

    if (isSending) {
      sendChatMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSending]);

  // チャット履歴が更新されたときに自動で下にスクロールするエフェクト
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // ドロワーの開閉を制御する処理
  const toggleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  //#endregion

  //#region 画面遷移処理

  const toBattleRoomViewSegue = (battleId: string) => {
    setBattleRoomListened(false);
    getBattleRoomData(battleId).then((battleData) => {
      console.log("roomData: ", battleData);
      if (battleData.status === "matched") {
        if (user && user.isAnonymous) {
          // ゲストユーザーの場合はデフォルトのAIを使用
          const props: OnlineRoomViewProps = {
            battleData: battleData,
            botData: {
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
          console.log("props: ", props);
          navigate(appPaths.BattleRoomView(battleId), {
            state: props,
          });
        } else if (bots) {
          // プレイヤーの場合はプロフィールのAIを使用
          const props: OnlineRoomViewProps = {
            battleData: battleData,
            botData: bots,
          };
          navigate(appPaths.BattleRoomView(battleId), { state: props });
        } else {
          console.error("ルームに入室できませんでした。");
          cancelMatching();
        }
      }
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("ログアウトしました");
      navigate(appPaths.login);
    } catch (error) {
      console.error("ログアウトエラー: ", error);
    }
  };

  const handleLogin = () => {
    navigate(appPaths.login);
  };

  const handleFeedback = () => {
    navigate(appPaths.impression_edit);
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

  const handlePromptEdit = () => {
    navigate(appPaths.prompt_edit, { state: bots });
  };

  const handleHowToPlay = () => {
    navigate(appPaths.how_to_play);
  };

  const handleIconGenerator = () => {
    navigate(appPaths.icon_generator, { state: profile });
  };
  //#endregion

  const xsSize = 12;
  const mdSize = 2;

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
              {/* <Button
                startIcon={<InfoOutlinedIcon />}
                variant="text"
                color="inherit"
                onClick={handleHowToPlay}
                sx={{
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                ゲームの遊び方
              </Button> */}
              <Button
                variant="outlined"
                color="inherit"
                onClick={user.isAnonymous ? handleLogin : handleLogout}
                sx={{ whiteSpace: "nowrap", ml: 2 }}
              >
                {user.isAnonymous ? "ログイン" : "ログアウト"}
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
                    mb: 4,
                    flex: 1,
                  }}
                >
                  <Box
                    textAlign="center"
                    mb={mdSize}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {/* プロフィール画像またはデフォルトアイコン */}
                    {photoURL ? (
                      <IconButton onClick={handleIconGenerator}>
                        <Avatar
                          src={photoURL}
                          alt={user?.displayName || "Guest"}
                          sx={{ width: 40, height: 40, mr: 2 }}
                        />
                      </IconButton>
                    ) : (
                      <IconButton
                        onClick={() => {
                          user.isAnonymous
                            ? handleLogin()
                            : handleIconGenerator();
                        }}
                      >
                        <AccountCircleIcon
                          sx={{ width: 40, height: 40, mr: 2, color: "gray" }}
                        />
                      </IconButton>
                    )}
                    <Typography variant="h6" color="text.primary">
                      {playerName}
                    </Typography>
                  </Box>

                  {user.isAnonymous ? (
                    <Box mb={mdSize}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={handleLogin}
                      >
                        ログイン
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={handleProfileEditClick}
                    >
                      プロフィール編集
                    </Button>
                  )}
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
                    mb: 4,
                    flex: 1,
                  }}
                >
                  {user && !user.isAnonymous ? (
                    <Box mb={mdSize}>
                      <Typography
                        variant="h5"
                        color="text.primary"
                        gutterBottom
                      >
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
                  ) : (
                    <Box mb={mdSize}>
                      <Typography
                        variant="h5"
                        color="text.primary"
                        gutterBottom
                      >
                        <EditIcon color="primary" sx={{ mr: 1 }} />
                        プレイヤー名の変更
                      </Typography>
                      <TextField
                        label="新しいプレイヤー名"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        variant="outlined"
                        fullWidth
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={handleNameChangeClick}
                        disabled={newName === playerName}
                      >
                        名前変更
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* バトル */}
              <Grid
                item
                xs={12}
                sm={12}
                md={12}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Card
                  sx={{
                    padding: 3,
                    borderRadius: 2,
                    boxShadow: 3,
                    mb: 4,
                    flex: 1,
                  }}
                >
                  {/* タイトルと「遊び方」ボタンを横並びに配置 */}
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

                  {/* 新しいGridコンテナを追加 */}
                  <Grid container spacing={2} sx={{ mt: 1 }}>
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
                              <FormControlLabel
                                value="ai"
                                control={<Radio />}
                                label="AIがプレイする"
                              />
                              <FormControlLabel
                                value="human"
                                control={<Radio />}
                                label="自分でプレイする"
                              />
                            </RadioGroup>
                          </FormControl>
                        </Box>
                        {selectedIsHuman === false &&
                          !user.isAnonymous &&
                          bots && (
                            <FormControl fullWidth sx={{ mt: 2 }}>
                              <InputLabel id="prompt-select-label">
                                使用するプロンプト
                              </InputLabel>
                              <Select
                                labelId="prompt-select-label"
                                value={
                                  selectedPromptId !== null
                                    ? selectedPromptId
                                    : bots.defaultId
                                }
                                label="使用するプロンプト"
                                onChange={handlePromptChange}
                              >
                                {bots.data.map((bot) => (
                                  <MenuItem key={bot.id} value={bot.id}>
                                    {bot.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        <ButtonGroup fullWidth sx={{ mt: 3 }}>
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
                          disabled
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

                        {/* ランダムマッチ */}
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
                          >
                            <CircularProgress size={24} />
                            <Typography variant="body1" sx={{ ml: 2 }}>
                              マッチング中...
                            </Typography>
                          </Box>
                        )}

                        <Divider sx={{ mt: 4, mb: 4 }} />

                        {/* プライベートルーム */}
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
              <Grid
                item
                xs={xsSize}
                sm={12}
                md={12}
                sx={{ display: "flex", flexDirection: "column" }}
              >
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
                    {user.isAnonymous ? (
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleOpenGeneratePrompt}
                        startIcon={<AddIcon />} // 左側にアイコンを追加
                      >
                        テンプレートから作成
                      </Button>
                    ) : (
                      ""
                    )}
                  </Box>
                  {user.isAnonymous ? (
                    <TextField
                      label="AIへの命令を入力してください。"
                      multiline
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      fullWidth
                      sx={{ mt: 2 }}
                    />
                  ) : (
                    <>
                      <Typography
                        variant="body1"
                        color="text.primary"
                        sx={{ whiteSpace: "pre-wrap", mt: 2, mb: 2 }}
                      >
                        設定中のプロンプト：{bots?.data[bots.defaultId].name}
                      </Typography>
                      <Divider></Divider>
                      <Typography
                        variant="body1"
                        color="text.primary"
                        sx={{ whiteSpace: "pre-wrap", mt: 2 }}
                      >
                        {aiPrompt}
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={handlePromptEdit}
                      >
                        プロンプト編集
                      </Button>
                    </>
                  )}
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
                value={roomId}
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
                width: "800px", // 固定幅
                height: "500px", // 固定高さ
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
              {/* <IconButton
                aria-label="close"
                onClick={handleTutorialClose}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                }}
              >
                <CloseIcon />
              </IconButton> */}
            </DialogTitle>
            <DialogContent>
              {/* Stepper */}
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

          {/* プロンプト生成ツールのダイアログ */}
          <Dialog
            open={openGeneratePrompt}
            onClose={handleCloseGeneratePrompt}
            fullWidth
            maxWidth="md"
            BackdropProps={{
              sx: {
                backgroundColor: "rgba(0, 0, 0, 0.7)", // より濃いバックドロップ
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
            {/* <DialogActions
              sx={{
                justifyContent: "space-between",
                padding: "16px 24px",
                backgroundColor: "#f0f0f0",
              }}
            >
              <Button
                onClick={handleCloseGeneratePrompt}
                color="secondary"
                variant="outlined"
                startIcon={<CloseIcon />}
                sx={{
                  borderRadius: 2,
                  padding: "8px 16px",
                }}
              >
                閉じる
              </Button>

              <Button
                onClick={() => handleCompleteGeneratePrompt(prompt)}
                color="primary"
                variant="outlined"
                startIcon={<CheckIcon />}
                sx={{
                  borderRadius: 2,
                  padding: "8px 24px",
                }}
              >
                完了
              </Button>
            </DialogActions> */}
          </Dialog>

          {/* フローティングボタン */}
          <Fab
            color="primary"
            aria-label="チャット"
            sx={{ position: "fixed", bottom: 100, right: 16, zIndex: 1300 }}
            onClick={() => toggleDrawer(true)}
          >
            <ChatIcon />
          </Fab>
          {/* Drawer for テストチャット */}
          <Drawer
            anchor="right"
            open={isDrawerOpen}
            onClose={() => toggleDrawer(false)}
            transitionDuration={500} // アニメーションの時間を指定
            sx={{
              "& .MuiDrawer-paper": {
                transition: "transform 0.5s ease-in-out", // 開閉時のスムーズなアニメーション
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
                {/* Header */}
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

                {/* Chat History */}
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
                                user.photoURL ? (
                                  <Avatar
                                    src={user.photoURL}
                                    alt="User Avatar"
                                  />
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

                {/* Message Input Section */}
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
                    onClick={handleSendMessage}
                    disabled={isSending || !chatMessage.trim()}
                    sx={{
                      ml: 2,
                      height: "auto", // ボタンの高さを入力フィールドに合わせる
                      alignSelf: "center",
                      py: 2, // 高さを入力フィールドとマッチさせるためにパディングを使用
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
                onClick={handleFeedback}
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
          mt={mdSize}
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
