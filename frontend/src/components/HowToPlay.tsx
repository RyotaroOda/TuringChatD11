// frontend/src/views/HowToPlay.tsx

import React, { useEffect, useState } from "react";
import {
  AppBar,
  Typography,
  Box,
  Container,
  Paper,
  Toolbar,
  IconButton,
  Divider,
  List,
  ListItem,
  Button,
  Tabs,
  Tab,
  Avatar,
  CircularProgress,
  Drawer,
  Fab,
  ListItemAvatar,
  ListItemText,
  Slide,
  TextField,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import PersonIcon from "@mui/icons-material/Person";
import StarIcon from "@mui/icons-material/Star";
import CopyrightIcon from "@mui/icons-material/Copyright";
import WarningIcon from "@mui/icons-material/Warning";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import BrushIcon from "@mui/icons-material/Brush";
import CodeIcon from "@mui/icons-material/Code";
import ArticleIcon from "@mui/icons-material/Article";
import { appPaths } from "../App.tsx";
import SchoolIcon from "@mui/icons-material/School";
import { GPTMessage } from "../shared/types.ts";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { auth } from "../API/firebase_f.ts";

import { askAITeacher, generateTestMessage } from "../API/chatGPT_f.ts";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
    body1: {
      lineHeight: 1.7,
    },
    h4: {
      fontWeight: 700,
      marginBottom: "0.5em",
    },
    h5: {
      fontWeight: 600,
      marginBottom: "0.3em",
    },
    h6: {
      fontWeight: 500,
    },
  },
  palette: {
    primary: {
      main: "#1976d2",
    },
    background: {
      default: "#f9f9f9",
    },
  },
  components: {
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: "48px",
        },
        indicator: {
          transition: "all 0.3s ease",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          minHeight: "48px",
        },
      },
    },
  },
});

const HowToPlay: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const photoURL = auth.currentUser?.photoURL;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<GPTMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const toggleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  // メッセージ送信とAIの応答を処理するエフェクト
  useEffect(() => {
    const sendChatMessage = async () => {
      try {
        const filteredMessages = chatHistory.filter(
          (message) => message.role !== "system"
        );
        const responseContent = await askAITeacher(filteredMessages);
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

  return (
    <ThemeProvider theme={theme}>
      <Slide
        in={true}
        direction="left"
        mountOnEnter
        unmountOnExit
        timeout={700}
      >
        <div>
          <AppBar position="static" elevation={0}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => navigate(-1)}
                sx={{ mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                遊び方
              </Typography>
            </Toolbar>
          </AppBar>
          <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
            <Paper elevation={1} sx={{ p: 4, backgroundColor: "#ffffff" }}>
              {/* タブ切り替え */}
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
                <Tabs
                  value={tabIndex}
                  onChange={handleTabChange}
                  variant="fullWidth"
                >
                  <Tab label="ゲーム説明" />
                  <Tab label="教育教材" />
                </Tabs>
              </Box>

              {/* ゲーム説明タブコンテンツ */}
              {tabIndex === 0 && (
                <Box>
                  <Box display="flex" alignItems="center" mb={3}>
                    <SportsEsportsIcon
                      sx={{ mr: 1, color: "primary.main", fontSize: 32 }}
                    />
                    <Typography variant="h4" gutterBottom>
                      ゲームのルール
                    </Typography>
                  </Box>

                  <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: "#fff" }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <StarIcon sx={{ mr: 1, color: "primary.main" }} />
                      <Typography variant="h5" gutterBottom>
                        このゲームについて
                      </Typography>
                    </Box>
                    <Typography variant="body1" paragraph>
                      このゲームは、チャットを通して相手が「人間」か「AI」かを見抜くことを目的としています。あなたが相手の正体を当てるか、逆に見破られるかが勝負のカギです。
                    </Typography>
                    <Typography variant="body1" paragraph>
                      このゲームは「チューリングテスト」を元に作られており、プレイする中で、AIに対する「プロンプト」の組み立て方を学ぶことができます。
                    </Typography>
                  </Paper>

                  <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: "#fff" }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <InfoOutlinedIcon sx={{ mr: 1, color: "primary.main" }} />
                      <Typography variant="h5" gutterBottom>
                        チューリングテストとは？
                      </Typography>
                    </Box>
                    <Typography variant="body1" paragraph>
                      チューリングテストは、言葉による会話から、「相手が人間か機械か」を判定しようとするテストです。
                      この概念を提唱したアラン・チューリングは、「人工知能の父」と呼ばれAI研究で非常に有名な人物です。
                    </Typography>
                  </Paper>

                  <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: "#fff" }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <TipsAndUpdatesIcon
                        sx={{ mr: 1, color: "primary.main" }}
                      />
                      <Typography variant="h5" gutterBottom>
                        プロンプトとは？
                      </Typography>
                    </Box>
                    <Typography variant="body1" paragraph>
                      プロンプトとは、AIに対して行う「指示文」のことです。上手なプロンプトを作ると、AIはより的確な回答や作品を生み出せます。
                      <br />
                      以下はプロンプト作成のポイントです。
                    </Typography>
                    <List sx={{ listStyleType: "disc", pl: 4 }}>
                      <ListItem sx={{ display: "list-item" }}>
                        何をしてほしいかを明確かつ簡潔に伝える
                      </ListItem>
                      <ListItem sx={{ display: "list-item" }}>
                        必要な情報をできるだけ詳しく入れる
                      </ListItem>
                      <ListItem sx={{ display: "list-item" }}>
                        お手本やヒントを提示して、AIを正しい方向へ導く
                      </ListItem>
                    </List>
                  </Paper>

                  <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: "#fff" }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <SportsEsportsIcon
                        sx={{ mr: 1, color: "primary.main" }}
                      />
                      <Typography variant="h5" gutterBottom>
                        プレイモード
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <SmartToyIcon sx={{ mr: 1, color: "primary.main" }} />
                        <Typography variant="h6" gutterBottom>
                          AIモード
                        </Typography>
                      </Box>
                      <Typography variant="body1" paragraph>
                        このモードでは、AIがあなたに代わってチャットを行います。
                        相手があなたを「人間」だと思いこんだ場合は勝利ですが、「AIだ」と見破られると負けになります。
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <PersonIcon sx={{ mr: 1, color: "primary.main" }} />
                        <Typography variant="h6" gutterBottom>
                          手動モード
                        </Typography>
                      </Box>
                      <Typography variant="body1" paragraph>
                        このモードでは、あなた自身が相手とチャットします。
                        相手が「AI」だと見抜けばあなたの勝利ですが、逆に「人間だ」と見破られると負けになります。
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* 教育教材タブコンテンツ */}
              {tabIndex === 1 && (
                <Box>
                  <Box display="flex" alignItems="center" mb={3}>
                    <SchoolIcon
                      sx={{ mr: 1, color: "primary.main", fontSize: 28 }}
                    />
                    <Typography variant="h4" gutterBottom>
                      教育用
                    </Typography>
                  </Box>

                  {/* 生成AIとは？ */}
                  <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: "#fff" }}>
                    <Box mb={4}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <SmartToyIcon sx={{ mr: 1, color: "primary.main" }} />
                        <Typography variant="h5" gutterBottom>
                          生成AIとは？
                        </Typography>
                      </Box>
                      <Typography variant="body1" paragraph sx={{ ml: 4 }}>
                        AIの中でも「新しいものを作る」のが得意なAI
                      </Typography>
                      <Typography
                        variant="body1"
                        paragraph
                        sx={{ ml: 4, fontWeight: 500 }}
                      >
                        できること
                      </Typography>
                      <List sx={{ pl: 6, pb: 2 }}>
                        <ListItem sx={{ display: "list-item" }}>
                          <ArticleIcon fontSize="small" sx={{ mr: 1 }} />
                          文章を書く
                        </ListItem>
                        <ListItem sx={{ display: "list-item" }}>
                          <BrushIcon fontSize="small" sx={{ mr: 1 }} />
                          絵を描く
                        </ListItem>
                        <ListItem sx={{ display: "list-item" }}>
                          <MusicNoteIcon fontSize="small" sx={{ mr: 1 }} />
                          音楽を作る
                        </ListItem>
                        <ListItem sx={{ display: "list-item" }}>
                          <CodeIcon fontSize="small" sx={{ mr: 1 }} />
                          プログラミング
                        </ListItem>
                      </List>
                    </Box>
                  </Paper>

                  {/* 生成AIのしくみ */}
                  <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: "#fff" }}>
                    <Box mb={4}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <TipsAndUpdatesIcon
                          sx={{ mr: 1, color: "primary.main" }}
                        />
                        <Typography variant="h5" gutterBottom>
                          生成AIのしくみ
                        </Typography>
                      </Box>
                      <Typography variant="body1" paragraph sx={{ ml: 4 }}>
                        -
                        生成AIは膨大な量のデータを学習して、ルールやパターンを理解します。
                        <br />
                        -
                        それまでの流れから「次に何が来るのか？」の予測をして、それを繰り返し行うことで新しいものを生成します。
                        <br />-
                        このようなAIのしくみを大規模言語モデル(LLM)という。
                      </Typography>
                    </Box>
                  </Paper>

                  {/* すごいところ */}
                  <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: "#fff" }}>
                    <Box mb={4}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <StarIcon sx={{ mr: 1, color: "primary.main" }} />
                        <Typography variant="h5" gutterBottom>
                          すごいところ
                        </Typography>
                      </Box>
                      <Typography variant="body1" paragraph sx={{ ml: 4 }}>
                        -
                        超便利：長い文章を数秒で作成したり、必要な情報を調べてまとめてもらったりして作業の効率が上がる。
                        <br />
                        <br />
                        -
                        誰でも簡単に使える：それまで高度なAIを使うにはプログラミング言語を使う必要があったが、生成AIは自然言語（日本語や英語など）による命令で動かすので誰でも使える。
                        <br />
                        生成AIへの指示のことを「プロンプト」という。
                      </Typography>
                    </Box>
                  </Paper>

                  {/* 注意点 */}
                  <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: "#fff" }}>
                    <Box mb={4}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <WarningIcon sx={{ mr: 1, color: "primary.main" }} />
                        <Typography variant="h5" gutterBottom>
                          注意点
                        </Typography>
                      </Box>
                      <Typography variant="body1" paragraph sx={{ ml: 4 }}>
                        -
                        間違いがある：AIが作ったものが必ず正しいとは限りません。それが本当に正しいのか自分でチェックすることが大事。AIの間違いを「ハルシネーション」という。
                        <br />
                        <br />
                        -
                        誰かの作品を勝手に学習して真似している場合がある：使用者の情報を学習していることもあるので個人情報は入力しない。
                        <br />
                        <br />
                        -
                        AIに頼りすぎない：自分で考えたり調べたりする道具の一つとして捉えて依存しすぎない。出力された内容を必ずチェックする。
                        <br />
                        <br />
                        - 使用年齢に制限があるサービスが多い：
                        <br />
                        (ChatGPT, Copilot など)：13歳以上
                        <br />
                        Google Bard：18歳以上
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}
            </Paper>
            <Box display="flex" justifyContent={"center"}>
              <Button
                variant="contained"
                sx={{ mt: 3, textAlign: "center" }}
                size="large"
                onClick={() => navigate(appPaths.HomeView)}
              >
                ホーム画面へ
              </Button>
            </Box>
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
            elevation={1}
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
                フィードバックを送る
              </Button>
            </Toolbar>
          </AppBar>

          {!isDrawerOpen && (
            <Fab
              color="primary"
              aria-label="チャット"
              sx={{ position: "fixed", bottom: 90, right: 15, zIndex: 1300 }}
              onClick={() => toggleDrawer(true)}
              variant="extended"
            >
              <ChatIcon sx={{ mr: 1 }} />
              AIに質問する
            </Fab>
          )}

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
                    チャットでAIに質問
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
                      ml: 1,
                      height: "auto",
                      alignSelf: "center",
                      py: 2,
                      px: 1,
                      minWidth: "60px",
                      minHeight: "60px",
                      borderRadius: "26px",
                    }}
                  >
                    {" "}
                    <SendIcon />
                  </Button>
                </Box>
                <Typography
                  mt={2}
                  variant="body2"
                  color="text.secondary"
                  alignSelf={"center"}
                >
                  生成AIの回答は必ずしも正しいとは限りません。
                </Typography>
              </Box>
            </Slide>
          </Drawer>
        </div>
      </Slide>
    </ThemeProvider>
  );
};

export default HowToPlay;
