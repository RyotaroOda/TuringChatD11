// frontend/src/views/HowToPlay.tsx
import React, { useState } from "react";
import {
  AppBar,
  Tabs,
  Tab,
  Typography,
  Box,
  Container,
  Paper,
  Toolbar,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton } from "@mui/material";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

const HowToPlay: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const elementaryGuide = `
### ゲームの遊び方ガイド

こんにちは！このゲームは、とっても楽しい「チューリングゲーム」です。小学生のみなさんでも簡単に遊べるので、一緒にやってみましょう！

---

#### ゲームの目的

相手がおしゃべりしているのが「人間」か「コンピューター（AI）」かを当てるゲームです。また、自分がおしゃべりするときは、相手に自分が人間かAIかを気づかれないようにします。

---

#### 遊び方

1. **ログインする**

   - ゲームを始めるためにログインします。アカウントがなくても「ゲスト」として遊べます。

2. **部屋に入る**

   - お友だちと一緒に遊ぶときは、同じ「ルームID」を使って部屋に入ってください。

3. **プレイ方法を選ぶ**

   - **自分でプレイする**：あなた自身がおしゃべりします。
   - **AIにプレイさせる**：コンピューターがおしゃべりしてくれます。

4. **AIボットを選ぶ（AIにプレイさせる場合）**

   - いろいろな性格や話し方をするAIボットから好きなものを選んでください。

5. **準備完了**

   - 準備ができたら「準備完了」ボタンを押します。相手も準備できるまで待ちましょう。

6. **ゲーム開始**

   - お題（トピック）が表示されたら、交互におしゃべりを始めます。

7. **おしゃべりを楽しむ**

   - お題に沿って、楽しくお話ししましょう。全部で数回メッセージを交換します。

8. **相手を当てる**

   - おしゃべりが終わったら、相手が「人間」か「AI」かを考えて当ててみてください。

9. **結果発表**

   - お互いの答え合わせをして、正解かどうかを確認します。

---

#### ポイント

- **工夫して話そう**：自分が人間かAIかをばれないように、おもしろい言い方や質問を考えてみましょう。
- **よく読む**：相手のメッセージをしっかり読んで、どちらか考えてみてください。
- **楽しむことが一番**：ゲームなので、リラックスして楽しんでくださいね！

---

さあ、ゲームを始めましょう！友だちや家族と一緒に、誰が一番たくさん当てられるか挑戦してみてね！
`;

  const teenGuide = `
### チューリングゲームの遊び方ガイド（中高生向け）

こんにちは！このガイドでは、あなたが楽しめる「チューリングゲーム」の遊び方を説明します。このゲームは、相手が人間かAI（人工知能）かを見極めるスリリングなチャットゲームです。

---

#### ゲームの目的

相手とチャットを通じて会話し、相手が人間なのか、それともAIなのかを推測することが目的です。同時に、自分自身も相手に自分の正体を悟られないように会話を進めます。

---

#### ゲームの手順

1. **ログインまたはゲストプレイ**

   - アカウントを持っている場合はログインします。
   - アカウントがなくても「ゲストプレイ」でゲームを始められます。

2. **ルームに参加**

   - 友達と一緒にプレイする場合は、同じ「ルームID」を入力して同じルームに入ります。
   - ランダムマッチを選ぶと、世界中の誰かとマッチングします。

3. **プレイモードの選択**

   - **自分でプレイ**：あなた自身が会話を行います。
   - **AIにプレイさせる**：あなたの代わりにAIが会話します。

4. **AIボットの選択（AIにプレイさせる場合）**

   - さまざまな性格や話し方を持つAIボットから選択します。
   - ボットの設定（名前、モデル、パラメータなど）を確認して、自分の戦略に合ったものを選びましょう。

5. **準備完了**

   - 設定が完了したら「準備完了」ボタンをクリックします。
   - 相手が準備できるまで待ちましょう。

6. **バトル開始**

   - お題（トピック）が表示されます。これは会話のテーマです。
   - 会話はターン制で行われ、交互にメッセージを送信します。

7. **会話を楽しむ**

   - お題に沿って、自然な会話を心がけましょう。
   - 相手の正体を見極めるために、質問や応答を工夫してみてください。
   - ターン数と時間制限があるので注意しましょう。

8. **推測と回答**

   - 会話終了後、相手が人間かAIかを選択し、その理由を記入します。
   - 自分がAIを使っていた場合、相手にばれなかったか確認しましょう。

9. **結果発表**

   - お互いの回答と正解が表示されます。
   - 正解数やスコアを確認して、自分の推測力をチェックしましょう。

---

#### 戦略とヒント

- **自然な会話を心がける**

  - 人間らしい表現やスラングを使って、相手を惑わしましょう。
  - 逆に、相手が不自然な言い回しをしていないか注意深く読み取ります。

- **質問を活用する**

  - 相手に質問を投げかけて、応答から正体を推測します。
  - 専門的な話題や最新のニュースに触れてみるのも有効です。

- **時間管理**

  - ターンごとの時間制限があるので、効率的にメッセージを作成しましょう。

- **AIボットの特徴を理解する**

  - AIにプレイさせる場合、選択したボットの性格や話し方を把握しておくと有利です。

---

#### 楽しみ方

- **友達と対戦**

  - 身近な友達と対戦して、お互いの洞察力を試しましょう。

- **スキルアップ**

  - 会話力や推理力を鍛える機会として活用できます。

- **AIの理解**

  - AIの振る舞いを体験することで、人工知能への理解を深められます。

---

さあ、チューリングゲームを楽しんで、相手の正体を見破りましょう！
`;

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
      <Container maxWidth="md">
        <Box mt={4}>
          <Paper elevation={3}>
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab label="小学生向け" />
              <Tab label="中高生向け" />
            </Tabs>
            <Box p={3} sx={{ maxHeight: "70vh", overflowY: "auto" }}>
              {tabIndex === 0 && (
                <Typography variant="body1">
                  <div
                    dangerouslySetInnerHTML={{ __html: elementaryGuide }}
                  ></div>
                </Typography>
              )}
              {tabIndex === 1 && (
                <Typography variant="body1">
                  <div dangerouslySetInnerHTML={{ __html: teenGuide }}></div>
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default HowToPlay;
