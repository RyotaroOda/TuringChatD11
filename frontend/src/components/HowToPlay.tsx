// frontend/src/views/HowToPlay.tsx

import React, { useState } from "react";
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
import { appPaths } from "../App.tsx";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  palette: {
    primary: {
      main: "#1976d2",
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

const HowToPlay: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
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
      <Container maxWidth="md" sx={{ mt: 4, pb: 8 }}>
        <Paper elevation={1} sx={{ p: 4, backgroundColor: "#ffffff" }}>
          <Box>
            <Box display="flex" alignItems="center" mb={2}>
              <SportsEsportsIcon sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h4" gutterBottom>
                ゲームのルール
              </Typography>
            </Box>

            <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: "#fafafa" }}>
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
                このゲームは「チューリングテスト」を元に作られており、プレイする中で、AIに対する「プロンプト」の組作り方を学ぶことができます。
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: "#fafafa" }}>
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

            <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: "#fafafa" }}>
              <Box display="flex" alignItems="center" mb={2}>
                <SmartToyIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h5" gutterBottom>
                  生成AIとは？
                </Typography>
              </Box>
              <Typography variant="body1" paragraph>
                生成AIとは、大量のデータから学び、自分で考えて新たに生成できる人工知能のことです。
                <br />
                たとえば、以下のようなことが可能です。
              </Typography>
              <List sx={{ listStyleType: "disc", pl: 4, pb: 2 }}>
                <ListItem sx={{ display: "list-item" }}>
                  チャットでの対話
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  文章や言語の翻訳
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  画像の作成や編集
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>音楽の作曲</ListItem>
              </List>
              {/* <Typography variant="body1" paragraph>
                昔のAIは、人間があらかじめ決めたルールに従うだけでしたが、生成AIは自ら考え、より柔軟な応用が可能です。
              </Typography> */}
            </Paper>

            <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: "#fafafa" }}>
              <Box display="flex" alignItems="center" mb={2}>
                <TipsAndUpdatesIcon sx={{ mr: 1, color: "primary.main" }} />
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

            <Divider sx={{ my: 4 }} />

            <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: "#fafafa" }}>
              <Box display="flex" alignItems="center" mb={2}>
                <SportsEsportsIcon sx={{ mr: 1, color: "primary.main" }} />
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
        </Paper>
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
            onClick={() => navigate(appPaths.impression_edit)}
            sx={{ ml: 2 }}
          >
            フィードバックを送る
          </Button>
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  );
};

export default HowToPlay;
