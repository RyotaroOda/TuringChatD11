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
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import { appPaths } from "../App.tsx";

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
  const [aiPrompt, setAiPrompt] = useState<string>("default prompt");
  const [battleId, setbattleId] = useState<string>("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [playerId, setPlayerId] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bots, setBots] = useState<BotData | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [isPushedMatching, setIsPushedMatching] = useState<boolean>(false);
  const [battleRoomListened, setBattleRoomListened] = useState<boolean>(false);

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
        isHuman: null,
      };
      const result = await requestMatch(player);
      if (result.battleId !== "") {
        setbattleId(result.battleId);
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
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                チューリングゲーム
              </Typography>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleFeedback}
                sx={{ mr: 2 }} // 右側に余白を追加
              >
                フィードバック
              </Button>
              {user.isAnonymous ? (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleLogin}
                >
                  ログイン
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleLogout}
                >
                  ログアウト
                </Button>
              )}
            </Toolbar>
          </AppBar>

          <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Box textAlign="center" mb={4}>
              <Typography variant="h4" color="text.primary" gutterBottom>
                こんにちは、{playerName}さん
              </Typography>
            </Box>

            {user && user.isAnonymous ? (
              <div>
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

                <Box mb={4}>
                  <Typography variant="h5" color="text.primary" gutterBottom>
                    AIプロンプト
                  </Typography>
                  <Card
                    sx={{
                      padding: 2,
                      borderRadius: 2,
                      background: theme.palette.background.paper,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <TextField
                      label="AIへの命令を入力して下さい。"
                      multiline
                      rows={4}
                      value={aiPrompt}
                      onChange={(e) => {
                        setAiPrompt(e.target.value);
                      }}
                      fullWidth
                      sx={{ mt: 2 }}
                    />
                  </Card>
                </Box>
              </div>
            ) : (
              <div>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleProfileEditClick}
                >
                  プロフィール編集
                </Button>

                <Box mb={4}>
                  <Typography variant="h5" color="text.primary" gutterBottom>
                    スコア
                  </Typography>
                  <Card
                    sx={{
                      padding: 3,
                      borderRadius: 2,
                      textAlign: "center",
                      background: theme.palette.primary.main,
                      color: "#fff",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: "bold", mr: 1 }}
                      >
                        {score}
                      </Typography>
                      <EmojiEvents fontSize="large" />
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{ mt: 1, fontStyle: "italic" }}
                    >
                      {getCommentByScore(score)}
                    </Typography>
                  </Card>
                </Box>

                <Box mb={4}>
                  <Typography variant="h5" color="text.primary" gutterBottom>
                    AIプロンプト
                  </Typography>
                  <Card
                    sx={{
                      padding: 2,
                      borderRadius: 2,
                      background: theme.palette.background.paper,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {aiPrompt}
                    </Typography>
                    <CardActions>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={handlePromptEdit}
                      >
                        プロンプト編集
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
              </div>
            )}
            <Box textAlign="center">
              {isPushedMatching ? (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={cancelMatching}
                  fullWidth
                >
                  キャンセル
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={startMatch}
                  fullWidth
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
                  <Typography variant="body1" style={{ marginLeft: 8 }}>
                    マッチング中...
                  </Typography>
                </Box>
              )}
            </Box>
          </Container>
        </>
      ) : (
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
