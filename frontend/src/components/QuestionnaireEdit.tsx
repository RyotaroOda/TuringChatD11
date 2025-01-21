import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Paper,
  AppBar,
  Toolbar,
} from "@mui/material";
import { Timestamp } from "firebase/firestore";
import { ThemeProvider } from "@emotion/react";
import { theme } from "../App.tsx";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";

// Firestore 更新関数（既存のものをそのまま利用する想定）
import { updateUserProfile } from "../API/firestore-database_f.ts";
import { QuestionnaireData } from "../shared/types.ts";

// アンケート回答データの型
// type QuestionnaireData = {
//   q1: string; // 1. 名前（自由記述）
//   q2: string; // 2. 年齢（数字入力）
//   q3: string; // 3. 学部・学科
//   q4: string; // 4. 生成AI経験
//   q5: string; // 5. 操作方法の分かりやすさ
//   q6: string; // 6. インターフェースの使いやすさ
//   q7: string; // 7. チュートリアルの内容
//   q8: string; // 8. 生成AIの基本的操作方法理解
//   q9: string; // 9. 生成AIの基本的仕組み理解
//   q10: string; // 10. 生成AI成果物の特徴理解
//   q11: string; // 11. 目的に応じた生成AIのカスタマイズ理解
//   q12: string; // 12. 生成AI利用のリスク・倫理的課題理解
//   q13: string; // 13. ゲーム要素は学習意欲を高めるか
//   q14: string; // 14. 主体的に学習や操作に取り組めたか
//   q15: string; // 15. ツールを使用しない場合と比べて成績・理解度向上か
//   q16: string; // 16. 今後もAI活用ツールを使って学びたいか
//   q17: string; // 17. ツール全体の満足度
//   q18: string; // 18. 他の教科・学習活動にも活用できると思うか
//   q19: string; // 19. 自由記述欄
//   timestamp: Timestamp;
// };

const QuestionnaireEdit: React.FC = () => {
  // アンケート回答データをステートで管理
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q5: "",
    q6: "",
    q7: "",
    q8: "",
    q9: "",
    q10: "",
    q11: "",
    q12: "",
    q13: "",
    q14: "",
    q15: "",
    q16: "",
    q17: "",
    q18: "",
    q19: "",
    timestamp: Timestamp.now(),
  });

  const navigate = useNavigate();

  // 生成AIの利用経験（質問4）用のラベル
  const ratingAIExperience = [
    { value: "1", label: "1: 全く利用したことがない" },
    { value: "2", label: "2: 触ったことはあるが、使い方はよくわからない" },
    { value: "3", label: "3: 簡単な操作はしたことがある" },
    { value: "4", label: "4: 定期的に利用している" },
    { value: "5", label: "5: 活用法を熟知している" },
  ];

  // 一般的な5段階評価用のラベル
  const ratingGeneral = [
    { value: "1", label: "1: まったくそう思わない" },
    { value: "2", label: "2: あまりそう思わない" },
    { value: "3", label: "3: どちらともいえない" },
    { value: "4", label: "4: そう思う" },
    { value: "5", label: "5: とてもそう思う" },
  ];

  // 満足度用のラベル（質問17）
  const ratingSatisfaction = [
    { value: "1", label: "1: 全く満足していない" },
    { value: "2", label: "2: あまり満足していない" },
    { value: "3", label: "3: どちらとも言えない" },
    { value: "4", label: "4: 満足している" },
    { value: "5", label: "5: 非常に満足している" },
  ];

  // 入力変更時のハンドラ
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setQuestionnaire((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // フォーム送信時のハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 必須項目チェック（例として全項目必須に設定）
    const missingFields = Object.entries(questionnaire).filter(([key, val]) => {
      if (key === "timestamp") return false;
      return typeof val === "string" && val.trim() === "";
    });

    if (missingFields.length > 0) {
      alert("すべての項目に回答してください。");
      return;
    }

    // Firestore へ送信
    try {
      await updateUserProfile({ questionnaire });
      alert("アンケートを送信しました。");
      navigate(-1);
    } catch (error) {
      console.error(error);
      alert("送信に失敗しました。");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            sx={{
              textTransform: "none",
              borderColor: "#ffffff",
              color: "#ffffff",
              ":hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
            onClick={() => navigate("/")}
          >
            戻る
          </Button>
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
            アンケートフォーム
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {/* アンケートの説明文 */}
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            本アンケートは、<strong>生成 AI を活用した学習ツール</strong>
            を使用した 感想や学習効果についてお伺いするものです。回答内容は、
            研究・教育改善の目的以外には使用いたしません。
            すべての項目に正直にお答えいただき、自由記述欄
            ではご意見・ご感想を遠慮なくご記入ください。
          </Typography>
        </Paper>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {/* -- 1. 基本情報 -- */}
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold" }}
            >
              1. 基本情報
            </Typography>

            {/* 1. 名前（自由記述） ※元は 0. 年齢（自由記述） */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  1. 名前（自由記述）
                </FormLabel>
                <TextField
                  name="q1"
                  value={questionnaire.q1}
                  onChange={handleChange}
                  placeholder="例）山田 太郎"
                  fullWidth
                />
              </FormControl>
            </Paper>

            {/* 2. 年齢（数字入力） ※元は 1. 年齢（数字入力） */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  2. 年齢（数字）
                </FormLabel>
                <TextField
                  name="q2"
                  value={questionnaire.q2}
                  onChange={handleChange}
                  type="number"
                  placeholder="例）20、21、22"
                  fullWidth
                />
              </FormControl>
            </Paper>

            {/* 3. 学部・学科（自由記述） ※元は 2. 学部・学科 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  3. 所属
                </FormLabel>
                <TextField
                  name="q3"
                  value={questionnaire.q3}
                  onChange={handleChange}
                  placeholder="例）工学部情報学科、文学部英語学科 など"
                  fullWidth
                />
              </FormControl>
            </Paper>

            {/* 4. 生成 AI 利用経験（5段階評価） ※元は 3. 生成 AI... */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  4. 生成 AI（ChatGPT など）を利用した経験（5 段階評価）
                </FormLabel>
                <RadioGroup
                  name="q4"
                  value={questionnaire.q4}
                  onChange={handleChange}
                >
                  {ratingAIExperience.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* -- 2. ツールの操作性・使いやすさ -- */}
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold" }}
            >
              2. ツールの操作性・使いやすさ
            </Typography>

            {/* 5. 操作方法は分かりやすかったか ※元は 4 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  5. 操作方法は分かりやすかったと感じますか？（5 段階評価）
                </FormLabel>
                <RadioGroup
                  name="q5"
                  value={questionnaire.q5}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* 6. インターフェースは使いやすかったか ※元は 5 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  6.
                  インターフェース（画面レイアウトやボタン配置）は使いやすかったですか？（5
                  段階評価）
                </FormLabel>
                <RadioGroup
                  name="q6"
                  value={questionnaire.q6}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* 7. チュートリアルは十分か ※元は 6 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  7. チュートリアルの内容は十分でしたか？（5 段階評価）
                </FormLabel>
                <RadioGroup
                  name="q7"
                  value={questionnaire.q7}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* -- 3. 学習効果・理解度 -- */}
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold" }}
            >
              3. 学習効果・理解度
            </Typography>

            {/* 8. 生成 AI の基本的な操作方法を理解できたか ※元は7 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  8. 「生成 AI の基本的な操作方法」を理解できましたか？（5
                  段階評価）
                </FormLabel>
                <RadioGroup
                  name="q8"
                  value={questionnaire.q8}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* 9. 生成 AI の基本的な仕組みを理解できたか ※元は8 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  9. 「生成 AI の基本的な仕組み」を理解できましたか？（5
                  段階評価）
                </FormLabel>
                <RadioGroup
                  name="q9"
                  value={questionnaire.q9}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* 10. 生成 AI が生み出す成果物の特徴を理解できたか ※元は9 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  10. 「生成 AI が生み出す成果物の特徴」を理解できましたか？（5
                  段階評価）
                </FormLabel>
                <RadioGroup
                  name="q10"
                  value={questionnaire.q10}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* 11. 目的に応じた生成AIのカスタマイズ方法を理解できたか ※元は10 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  11. 「目的に応じた生成 AI
                  のカスタマイズ方法」を理解できましたか？（5 段階評価）
                </FormLabel>
                <RadioGroup
                  name="q11"
                  value={questionnaire.q11}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* 12. 生成 AI の利用に伴うリスクや倫理的課題を理解できたか ※元は11 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  12. 「生成 AI
                  の利用に伴うリスクや倫理的課題」を理解できましたか？（5
                  段階評価）
                </FormLabel>
                <RadioGroup
                  name="q12"
                  value={questionnaire.q12}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* -- 4. モチベーション・学習意欲 -- */}
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold" }}
            >
              4. モチベーション・学習意欲
            </Typography>

            {/* 13. ゲーム要素は学習意欲を高めるのに役立ったか ※元は12 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  13.
                  ゲーム要素（バトル形式や得点システムなど）は学習意欲を高めるのに役立ちましたか？（5
                  段階評価）
                </FormLabel>
                <RadioGroup
                  name="q13"
                  value={questionnaire.q13}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* 14. 主体的に学習や操作に取り組めたか ※元は13 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  14.
                  このツールを使っている間、主体的に学習や操作に取り組めたと感じますか？（5
                  段階評価）
                </FormLabel>
                <RadioGroup
                  name="q14"
                  value={questionnaire.q14}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* 15. ツールを使用しない場合と比べて理解度が向上したか ※元は14 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  15.
                  ツールを使用しない場合と比べて、自分の成績や理解度が向上したと感じますか？（5
                  段階評価）
                </FormLabel>
                <RadioGroup
                  name="q15"
                  value={questionnaire.q15}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* 16. 今後もAI活用ツールを使って学びたいか ※元は15 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  16. 今後もこのような AI
                  活用ツールを使って学びたいと思いますか？（5 段階評価）
                </FormLabel>
                <RadioGroup
                  name="q16"
                  value={questionnaire.q16}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* -- 5. 総合評価・自由記述 -- */}
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold" }}
            >
              5. 総合評価・自由記述
            </Typography>

            {/* 17. ツール全体の満足度 ※元は16 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  17. このツール全体の満足度（5 段階評価）
                </FormLabel>
                <RadioGroup
                  name="q17"
                  value={questionnaire.q17}
                  onChange={handleChange}
                >
                  {ratingSatisfaction.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* 18. 他の教科・学習活動にも活用できるか ※元は17 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  18. 他の教科・学習活動にも活用できると思いますか？（5
                  段階評価）
                </FormLabel>
                <RadioGroup
                  name="q18"
                  value={questionnaire.q18}
                  onChange={handleChange}
                >
                  {ratingGeneral.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* 19. 自由記述欄 ※元は18 */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <FormControl fullWidth>
                <FormLabel
                  component="legend"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  19. 自由記述欄
                </FormLabel>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  ・良かった点・悪かった点を具体的に書いてください。
                  <br />
                  ・生成 AI
                  やゲーム型学習の今後の導入・改良について、希望やアイデアがあればご記入ください。
                </Typography>
                <TextField
                  name="q19"
                  value={questionnaire.q19}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  placeholder="自由にご記入ください"
                  fullWidth
                />
              </FormControl>
            </Paper>

            {/* 送信ボタン */}
            <Box textAlign="center">
              <Button
                variant="contained"
                color="primary"
                type="submit"
                startIcon={<SendIcon />}
                sx={{ minWidth: 200, borderRadius: 2 }}
              >
                送信
              </Button>
            </Box>
          </Stack>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default QuestionnaireEdit;
