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
  IconButton,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

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
            <Box p={3} sx={{ overflowY: "auto" }}>
              {tabIndex === 0 && (
                <Typography variant="body1" component="div">
                  <div>
                    <h3>ゲームの遊び方ガイド</h3>
                    <p>
                      こんにちは！このゲームは、とっても楽しい「チューリングゲーム」です。小学生のみなさんでも簡単に遊べるので、一緒にやってみましょう！
                    </p>
                    <hr />
                    <h4>ゲームの目的</h4>
                    <p>
                      相手がおしゃべりしているのが「人間」か「コンピューター（AI）」かを当てるゲームです。また、自分がおしゃべりするときは、相手に自分が人間かAIかを気づかれないようにします。
                    </p>
                    <hr />
                    <h4>遊び方</h4>
                    <ol>
                      <li>
                        <strong>ログインする</strong>
                        <p>
                          ゲームを始めるためにログインします。アカウントがなくても「ゲスト」として遊べます。
                        </p>
                      </li>
                      <li>
                        <strong>部屋に入る</strong>
                        <p>
                          お友だちと一緒に遊ぶときは、同じ「ルームID」を使って部屋に入ってください。
                        </p>
                      </li>
                      <li>
                        <strong>プレイ方法を選ぶ</strong>
                        <ul>
                          <li>
                            自分でプレイする：あなた自身がおしゃべりします。
                          </li>
                          <li>
                            AIにプレイさせる：コンピューターがおしゃべりしてくれます。
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>AIボットを選ぶ（AIにプレイさせる場合）</strong>
                        <p>
                          いろいろな性格や話し方をするAIボットから好きなものを選んでください。
                        </p>
                      </li>
                      <li>
                        <strong>準備完了</strong>
                        <p>
                          準備ができたら「準備完了」ボタンを押します。相手も準備できるまで待ちましょう。
                        </p>
                      </li>
                      <li>
                        <strong>ゲーム開始</strong>
                        <p>
                          お題（トピック）が表示されたら、交互におしゃべりを始めます。
                        </p>
                      </li>
                      <li>
                        <strong>おしゃべりを楽しむ</strong>
                        <p>
                          お題に沿って、楽しくお話ししましょう。全部で数回メッセージを交換します。
                        </p>
                      </li>
                      <li>
                        <strong>相手を当てる</strong>
                        <p>
                          おしゃべりが終わったら、相手が「人間」か「AI」かを考えて当ててみてください。
                        </p>
                      </li>
                      <li>
                        <strong>結果発表</strong>
                        <p>
                          お互いの答え合わせをして、正解かどうかを確認します。
                        </p>
                      </li>
                    </ol>
                    <hr />
                    <h4>ポイント</h4>
                    <ul>
                      <li>
                        <strong>工夫して話そう</strong>
                        ：自分が人間かAIかをばれないように、おもしろい言い方や質問を考えてみましょう。
                      </li>
                      <li>
                        <strong>よく読む</strong>
                        ：相手のメッセージをしっかり読んで、どちらか考えてみてください。
                      </li>
                      <li>
                        <strong>楽しむことが一番</strong>
                        ：ゲームなので、リラックスして楽しんでくださいね！
                      </li>
                    </ul>
                    <hr />
                    <p>
                      さあ、ゲームを始めましょう！友だちや家族と一緒に、誰が一番たくさん当てられるか挑戦してみてね！
                    </p>
                  </div>
                </Typography>
              )}
              {tabIndex === 1 && (
                <Typography variant="body1" component="div">
                  <div>
                    <h3>チューリングゲームの遊び方ガイド（中高生向け）</h3>
                    <p>
                      こんにちは！このガイドでは、あなたが楽しめる「チューリングゲーム」の遊び方を説明します。このゲームは、相手が人間かAI（人工知能）かを見極めるスリリングなチャットゲームです。
                    </p>
                    <hr />
                    <h4>ゲームの目的</h4>
                    <p>
                      相手とチャットを通じて会話し、相手が人間なのか、それともAIなのかを推測することが目的です。同時に、自分自身も相手に自分の正体を悟られないように会話を進めます。
                    </p>
                    <hr />
                    <h4>ゲームの手順</h4>
                    <ol>
                      <li>
                        <strong>ログインまたはゲストプレイ</strong>
                        <p>
                          アカウントを持っている場合はログインします。アカウントがなくても「ゲストプレイ」でゲームを始められます。
                        </p>
                      </li>
                      <li>
                        <strong>ルームに参加</strong>
                        <p>
                          友達と一緒にプレイする場合は、同じ「ルームID」を入力して同じルームに入ります。ランダムマッチを選ぶと、世界中の誰かとマッチングします。
                        </p>
                      </li>
                      <li>
                        <strong>プレイモードの選択</strong>
                        <ul>
                          <li>自分でプレイ：あなた自身が会話を行います。</li>
                          <li>
                            AIにプレイさせる：あなたの代わりにAIが会話します。
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>AIボットの選択（AIにプレイさせる場合）</strong>
                        <p>
                          さまざまな性格や話し方を持つAIボットから選択します。ボットの設定（名前、モデル、パラメータなど）を確認して、自分の戦略に合ったものを選びましょう。
                        </p>
                      </li>
                      <li>
                        <strong>準備完了</strong>
                        <p>
                          設定が完了したら「準備完了」ボタンをクリックします。相手が準備できるまで待ちましょう。
                        </p>
                      </li>
                      <li>
                        <strong>バトル開始</strong>
                        <p>
                          お題（トピック）が表示されます。これは会話のテーマです。会話はターン制で行われ、交互にメッセージを送信します。
                        </p>
                      </li>
                      <li>
                        <strong>会話を楽しむ</strong>
                        <p>
                          お題に沿って、自然な会話を心がけましょう。相手の正体を見極めるために、質問や応答を工夫してみてください。ターン数と時間制限があるので注意しましょう。
                        </p>
                      </li>
                      <li>
                        <strong>推測と回答</strong>
                        <p>
                          会話終了後、相手が人間かAIかを選択し、その理由を記入します。自分がAIを使っていた場合、相手にばれなかったか確認しましょう。
                        </p>
                      </li>
                      <li>
                        <strong>結果発表</strong>
                        <p>
                          お互いの回答と正解が表示されます。正解数やスコアを確認して、自分の推測力をチェックしましょう。
                        </p>
                      </li>
                    </ol>
                    <hr />
                    <h4>戦略とヒント</h4>
                    <ul>
                      <li>
                        <strong>自然な会話を心がける</strong>
                        ：人間らしい表現やスラングを使って、相手を惑わしましょう。
                      </li>
                      <li>
                        <strong>質問を活用する</strong>
                        ：相手に質問を投げかけて、応答から正体を推測します。
                      </li>
                      <li>
                        <strong>時間管理</strong>
                        ：ターンごとの時間制限があるので、効率的にメッセージを作成しましょう。
                      </li>
                      <li>
                        <strong>AIボットの特徴を理解する</strong>
                        ：AIにプレイさせる場合、選択したボットの性格や話し方を把握しておくと有利です。
                      </li>
                    </ul>
                    <hr />
                    <h4>楽しみ方</h4>
                    <ul>
                      <li>
                        <strong>友達と対戦</strong>
                        ：身近な友達と対戦して、お互いの洞察力を試しましょう。
                      </li>
                      <li>
                        <strong>スキルアップ</strong>
                        ：会話力や推理力を鍛える機会として活用できます。
                      </li>
                      <li>
                        <strong>AIの理解</strong>
                        ：AIの振る舞いを体験することで、人工知能への理解を深められます。
                      </li>
                    </ul>
                    <p>
                      さあ、チューリングゲームを楽しんで、相手の正体を見破りましょう！
                    </p>
                  </div>
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
