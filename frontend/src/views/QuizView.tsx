import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  FormControlLabel,
  Checkbox,
  Typography,
  FormGroup,
  Container,
  AppBar,
  Toolbar,
} from "@mui/material";
import { quizSets } from "./quizData.ts"; // 複数正解に合わせて correctIndices を使用
import { useQuizContext } from "./QuizContext.tsx";
import App, { appPaths } from "../App.tsx";
import { addUserQuizResult } from "../API/firestore-database_f.ts";

const alphaLabels = "abcdefghijklmnopqrstuvwxyz".split("");

const QuizView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quizId = searchParams.get("quizId");
  const { updateQuizResult } = useQuizContext();

  // 現在の問題インデックス
  const [questionIndex, setQuestionIndex] = useState(0);

  // (複数選択可能) チェックボックスで選んだ選択肢を number[] で管理
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  // 問題ごとの正誤(合否)だけを配列で持つ [true/false, ...]
  const [answers, setAnswers] = useState<boolean[]>([]);

  // 現在の問題提出済みかどうか
  const [submitted, setSubmitted] = useState(false);

  // 提出後の合否
  const [isCorrect, setIsCorrect] = useState(false);

  // 解説表示スイッチ
  const [showExplanation, setShowExplanation] = useState(false);

  // 全問題終了後に結果表示画面へ
  const [showResult, setShowResult] = useState(false);

  // 対象クイズを取得
  const quiz = quizSets.find((q) => q.id === quizId);

  // クイズが存在しなければ一覧へ戻す
  useEffect(() => {
    if (!quiz) {
      navigate(appPaths.QuizSelection);
    }
  }, [quiz, navigate]);

  // 問題（questionIndex）が変わったら、選択肢・合否表示などをリセット
  useEffect(() => {
    setSelectedOptions([]);
    setSubmitted(false);
    setShowExplanation(false);
  }, [questionIndex]);

  const currentQuestion = quiz?.questions[questionIndex];

  /******************************************
   * Checkbox 選択 or 取消 した際の処理
   ******************************************/
  const handleCheckboxChange = (optionIndex: number) => {
    setSelectedOptions((prev) => {
      if (prev.includes(optionIndex)) {
        // 既に選択されていれば外す
        return prev.filter((value) => value !== optionIndex);
      } else {
        // 選択されてなければ追加
        return [...prev, optionIndex];
      }
    });
  };

  /******************************************
   * 提出ボタン
   ******************************************/
  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion) return;
    const { correctIndices } = currentQuestion;
    // 順序に影響されないようソートして比較する
    const sortedSelected = [...selectedOptions].sort();
    const sortedCorrect = [...correctIndices].sort();
    const matched =
      JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);

    setIsCorrect(matched);
    setAnswers((prev) => {
      const newArr = [...prev];
      newArr[questionIndex] = matched;
      return newArr;
    });
    setSubmitted(true);
    setShowExplanation(true);
  }, [currentQuestion, selectedOptions, questionIndex]);

  /******************************************
   * 次の問題 or 結果画面へ
   ******************************************/
  const handleNextQuestion = () => {
    if (!quiz) return;
    // 最終問題なら結果画面
    if (questionIndex === quiz.questions.length - 1) {
      // スコア反映
      const correctCount = answers.filter((v) => v).length;
      updateQuizResult(quizId || "", correctCount, quiz.questions.length);
      // ★ ここでクイズ結果を Firestore に保存
      // quizId, correctCount, totalCount を引数として渡す
      addUserQuizResult(
        quizId || "unknownQuiz",
        correctCount,
        quiz.questions.length
      );
      // 結果画面へ
      setShowResult(true);
    } else {
      // 次の問題へ
      setQuestionIndex((prev) => prev + 1);
    }
  };

  /******************************************
   * 結果画面の「戻る」
   ******************************************/
  const handleReturn = () => {
    navigate(appPaths.QuizSelection);
  };

  /******************************************
   * 結果画面
   ******************************************/
  if (showResult && quiz) {
    const correctCount = answers.filter((v) => v).length;
    const totalCount = quiz.questions.length;

    return (
      <Container maxWidth="md" sx={{ mt: 4, pb: 8 }}>
        <Box display="flex" flexDirection="column" gap={3}>
          <AppBar position="static">
            <Toolbar>
              <Typography
                variant="h6"
                sx={{
                  flexGrow: 1,
                  textAlign: "center",
                }}
              >
                {quiz.title} 結果
              </Typography>
            </Toolbar>
          </AppBar>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}></Typography>

          {/* 正解数 */}
          <Paper elevation={2} sx={{ p: 2, backgroundColor: "#F9FBE7" }}>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              あなたの正解数: {correctCount} / {totalCount}
            </Typography>
            <Typography variant="body2">
              必要に応じて復習しましょう。
            </Typography>
          </Paper>

          {/* 全問題振り返り */}
          {quiz.questions.map((q, i) => {
            // 正解ラベル(例: a, c)
            const correctLabel = q.correctIndices
              .map((idx) => alphaLabels[idx])
              .join(", ");
            const isAnswerCorrect = answers[i];

            return (
              <Box
                key={i}
                sx={{
                  p: 2,
                  border: "1px solid #ccc",
                  borderRadius: 2,
                  backgroundColor: isAnswerCorrect ? "#e0f2e9" : "#e0f0ff",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  問題 {i + 1}: {q.question}
                </Typography>

                {/* 合否 */}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {isAnswerCorrect
                    ? "あなたの解答: 正解"
                    : "あなたの解答: 不正解"}
                </Typography>

                {/* 正解表示 (a, b... など) */}
                <Typography variant="body2">正解: {correctLabel}</Typography>

                {/* 解説 */}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  解説: {q.explanation}
                </Typography>
              </Box>
            );
          })}

          <Button variant="contained" onClick={handleReturn}>
            戻る
          </Button>
        </Box>
      </Container>
    );
  }

  /******************************************
   * クイズが存在しない or 現在の問題がない
   ******************************************/
  if (!quiz || !currentQuestion) {
    return null;
  }

  // 提出後に表示する 正解 (例: a, c...)
  const correctChoiceLabels = currentQuestion.correctIndices
    .map((idx) => alphaLabels[idx])
    .join(", ");

  // 合否判定用: (正解か？) === (ユーザー選択しているか？) で○×
  const getMark = (optIndex: number): string => {
    const isOptionCorrect = currentQuestion.correctIndices.includes(optIndex);
    const isSelected = selectedOptions.includes(optIndex);
    // 一致していれば○、一致していなければ×
    return isOptionCorrect ? "○" : "×";
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 8 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              textAlign: "center",
            }}
          >
            {quiz.title}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box display="flex" flexDirection="column" gap={2}>
        <Paper
          elevation={3}
          sx={{ p: 3, backgroundColor: "#F3F8FF", borderRadius: 2 }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            問題 {questionIndex + 1} / {quiz.questions.length}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
            問題文をよく読み、正しい選択肢をすべて選んでください。
          </Typography>

          <Typography variant="body1" sx={{ mt: 2 }}>
            {currentQuestion.question}
          </Typography>

          {/* 選択肢を縦に並べる。 ラベルは a. b. c. ... */}
          <FormGroup sx={{ mt: 2 }}>
            {currentQuestion.options.map((option, idx) => {
              // 選択肢用ラベル (a, b, c, ...)
              const alpha = alphaLabels[idx];
              // 提出後は合否マークを表示
              const mark = submitted ? getMark(idx) : "　"; // 全角スペースなど

              return (
                <FormControlLabel
                  key={idx}
                  control={
                    <Checkbox
                      checked={selectedOptions.includes(idx)}
                      onChange={() => handleCheckboxChange(idx)}
                      disabled={submitted}
                    />
                  }
                  label={`${alpha}. ${option}`}
                  sx={{
                    mb: 1,
                    // 合否マークを左側に表示 (例: ○ a. 選択肢)
                    "& .MuiCheckbox-root": { mr: 1 },
                    // labelPlacement="end" がデフォルトだが、マークをさらに左に
                    // 表示するために工夫
                    position: "relative",
                    pl: 4, // 左に余白
                    "&::before": {
                      content: `"${mark}"`,
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontWeight: "bold",
                      color: mark === "○" ? "green" : "red",
                    },
                  }}
                />
              );
            })}
          </FormGroup>

          {!submitted ? (
            // まだ提出していない
            <Button
              variant="contained"
              onClick={handleSubmitAnswer}
              disabled={selectedOptions.length === 0}
              sx={{ mt: 2 }}
            >
              回答
            </Button>
          ) : (
            <>
              {/* 合否表示 */}
              <Typography variant="h6" sx={{ mt: 2 }}>
                {isCorrect ? "正解です！" : "残念、不正解です"}
              </Typography>

              {/* 提出後 ⇒ 正解ラベル例: a, c */}
              <Typography variant="body2" sx={{ mt: 1 }}>
                正解: {correctChoiceLabels}
              </Typography>

              {showExplanation && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  解説: {currentQuestion.explanation}
                </Typography>
              )}

              <Button
                variant="contained"
                color="secondary"
                onClick={handleNextQuestion}
                sx={{ mt: 2 }}
              >
                {questionIndex === quiz.questions.length - 1
                  ? "結果を確認する"
                  : "次の問題へ"}
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default QuizView;
