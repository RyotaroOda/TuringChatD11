// frontend/src/views/HomeView.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBattleRoomData,
  onMatched,
} from "../services/firebase-realtime-database.ts";
import {
  requestMatch,
  cancelRequest,
} from "../services/firebase-functions-client.ts";
import { signInAnonymously, signOut, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase_f.ts";
import { AIModel, BotData, PlayerData, ProfileData } from "../shared/types.ts";
import { getUserProfile } from "../services/firestore-database_f.ts";
import { OnlineRoomViewProps } from "./BattleRoomView.tsx";
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
  CardActions,
  ButtonGroup,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import { appPaths, variables } from "../App.tsx";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CopyrightIcon from "@mui/icons-material/Copyright";

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
  const [battleId, setBattleId] = useState<string>("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [playerId, setPlayerId] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bots, setBots] = useState<BotData | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [isPushedMatching, setIsPushedMatching] = useState<boolean>(false);
  const [battleRoomListened, setBattleRoomListened] = useState<boolean>(false);
  const [singlePlayDifficulty, setSinglePlayDifficulty] = useState<
    "初級" | "中級" | "上級"
  >("初級");

  //#endregion

  //#region ログイン状態の確認とプロフィール取得
  useEffect(() => {
    if (user) {
      setPlayerId(user.uid);
      if (user.isAnonymous) {
        setNewName("ゲスト");
        setPlayerName("ゲスト");
      } else {
        setPlayerName(user.displayName || "");
        fetchUserProfile();
      }
    }
  }, [user]);

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

  //#region マッチング処理
  const startMatch = async () => {
    setIsPushedMatching(true);
    try {
      const player: PlayerData = {
        id: playerId,
        name: playerName,
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
    setIsPushedMatching(false);
    setBattleRoomListened(false);
    setRoomId(null);
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

  //#region 画面遷移処理
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

  const handleSinglePlayChallenge = () => {
    // シングルプレイのゲーム画面に遷移（仮のパス）
    const props = {
      difficulty: singlePlayDifficulty,
    };
    // navigate(appPaths.single_play_game, { state: props });
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
  //#endregion

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
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                チューリングゲーム
              </Typography>
              <Button
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
              </Button>
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
          <Container maxWidth="sm" sx={{ mt: 4, pb: 8 }}>
            {/* プロフィール情報 */}
            <Card sx={{ padding: 4, borderRadius: 2, boxShadow: 3, mb: 4 }}>
              <Box textAlign="center" mb={4}>
                <Typography variant="h4" color="text.primary" gutterBottom>
                  こんにちは、{playerName}さん
                </Typography>
              </Box>
              {user.isAnonymous ? (
                <Box mb={4}>
                  <Typography variant="h5" color="text.primary" gutterBottom>
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
                  >
                    名前変更
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

            {/* スコア表示 */}
            {user && !user.isAnonymous && (
              <Card sx={{ padding: 4, borderRadius: 2, boxShadow: 3, mb: 4 }}>
                <Box mb={4}>
                  <Typography variant="h5" color="text.primary" gutterBottom>
                    スコア
                  </Typography>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: "bold", mr: 1, color: "primary.main" }}
                    >
                      {score}
                    </Typography>
                    <EmojiEvents
                      fontSize="large"
                      sx={{ color: "primary.main" }}
                    />
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ mt: 1, fontStyle: "italic", textAlign: "center" }}
                  >
                    {getCommentByScore(score)}
                  </Typography>
                </Box>
              </Card>
            )}

            {/* AIプロンプト */}
            <Card sx={{ padding: 4, borderRadius: 2, boxShadow: 3, mb: 4 }}>
              <Typography variant="h5" color="text.primary" gutterBottom>
                AIプロンプト
              </Typography>
              {user.isAnonymous ? (
                <TextField
                  label="AIへの命令を入力してください。"
                  multiline
                  rows={4}
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

            {/* ひとりであそぶ */}
            <Card sx={{ padding: 4, borderRadius: 2, boxShadow: 3, mb: 4 }}>
              <Typography variant="h5" color="text.primary" gutterBottom>
                ひとりであそぶ
              </Typography>
              <ButtonGroup fullWidth sx={{ mt: 2 }}>
                <Button
                  onClick={() => setSinglePlayDifficulty("初級")}
                  variant={
                    singlePlayDifficulty === "初級" ? "contained" : "outlined"
                  }
                >
                  初級
                </Button>
                <Button
                  onClick={() => setSinglePlayDifficulty("中級")}
                  variant={
                    singlePlayDifficulty === "中級" ? "contained" : "outlined"
                  }
                >
                  中級
                </Button>
                <Button
                  onClick={() => setSinglePlayDifficulty("上級")}
                  variant={
                    singlePlayDifficulty === "上級" ? "contained" : "outlined"
                  }
                >
                  上級
                </Button>
              </ButtonGroup>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleSinglePlayChallenge}
              >
                挑戦する
              </Button>
            </Card>

            {/* だれかとあそぶ */}
            <Card sx={{ padding: 4, borderRadius: 2, boxShadow: 3, mb: 4 }}>
              <Typography variant="h5" color="text.primary" gutterBottom>
                だれかとあそぶ
              </Typography>
              {/* ランダムマッチ */}
              <Box mt={2}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  ランダムマッチ
                </Typography>
                {isPushedMatching ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={cancelMatching}
                    fullWidth
                    sx={{ mt: 1 }}
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
              </Box>

              {/* プライベートルーム */}
              <Box mt={4}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  プライベートルーム
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateRoom}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  ルームを作る
                </Button>
                <Box display="flex" alignItems="center" sx={{ mt: 2 }}>
                  <TextField
                    label="ルームIDを入力"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    variant="outlined"
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleJoinRoom}
                    sx={{ ml: 2 }}
                  >
                    ルームに入る
                  </Button>
                </Box>
              </Box>
            </Card>
          </Container>

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
          mt={4}
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
