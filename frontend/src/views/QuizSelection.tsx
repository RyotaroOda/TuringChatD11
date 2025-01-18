import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Container,
  AppBar,
  Toolbar,
  ThemeProvider,
} from "@mui/material";
import { quizSets } from "./quizData.ts";
import { useQuizContext } from "./QuizContext.tsx";
import { appPaths, theme } from "../App.tsx";
import { getUserQuizResults } from "../API/firestore-database_f.ts";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const DIFFICULTIES = ["基礎レベル", "応用レベル", "上級レベル"];

const QuizSelection: React.FC = () => {
  const navigate = useNavigate();
  const { results } = useQuizContext();

  // 難易度ごとにクイズをグループ化するためのデータ構造
  const [groupedQuizzes, setGroupedQuizzes] = useState<
    Record<string, typeof quizSets>
  >({});
  useEffect(() => {
    // quizSets を difficulty 単位でまとめる
    const groups: Record<string, typeof quizSets> = {};

    quizSets.forEach((quiz) => {
      const level = quiz.difficulty || "その他";
      if (!groups[level]) {
        groups[level] = [];
      }
      groups[level].push(quiz);
    });

    setGroupedQuizzes(groups);
  }, []);

  const handleStartQuiz = (quizId: string) => {
    navigate(`${appPaths.QuizView}?quizId=${quizId}`);
  };

  const [firestoreResults, setFirestoreResults] = useState<
    Record<string, { correctCount: number; totalCount: number }>
  >({});
  {
    /*
         ★ useEffect により、マウント時に Firestore からクイズ結果を取得し、
         ★ quizIdごとの「ベストスコア」や「最後のスコア」などをまとめて保管する例
      */
  }
  useEffect(() => {
    (async () => {
      try {
        const quizAllResults = await getUserQuizResults();

        // quizIdごとに最大正答数を記録する形の例
        const aggregated: Record<
          string,
          { correctCount: number; totalCount: number }
        > = {};
        quizAllResults.forEach((result) => {
          const { quizId, correctCount, totalCount } = result;

          // ここでは「一番正答数が多いもの」を表示したい場合
          // あるいは「最新の解答」を表示したい場合は別途ロジックを変えてください
          if (!aggregated[quizId]) {
            aggregated[quizId] = { correctCount, totalCount };
          } else {
            // 正解数が多い方を保持 (例)
            if (correctCount > aggregated[quizId].correctCount) {
              aggregated[quizId] = { correctCount, totalCount };
            }
          }
        });
        setFirestoreResults(aggregated);
      } catch (error) {
        console.error("Firestore からクイズ結果の取得に失敗:", error);
      }
    })();
  }, []);

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
            クイズコース一覧
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, pb: 8 }}>
        <Box display="flex" flexDirection="column" gap={2}>
          {/* 難易度ごとにカードをまとめて表示 */}
          {DIFFICULTIES.map((difficulty) => {
            // グループにクイズが1つ以上あれば表示
            const quizzes = groupedQuizzes[difficulty];
            if (!quizzes || quizzes.length === 0) {
              return null;
            }
            return (
              <Box key={difficulty}>
                <Card
                  elevation={2}
                  sx={{
                    mb: 2,
                    mt: 2,
                    backgroundColor: "#F8F8FF",
                    borderRadius: 2,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      難易度: {difficulty}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      こちらは「{difficulty}」向けのクイズ一覧です
                    </Typography>
                  </CardContent>

                  {/* 各難易度のクイズを表示 */}
                  <Box
                    display="flex"
                    flexDirection="column"
                    gap={2}
                    ml={2}
                    mr={2}
                    mb={4}
                  >
                    {quizzes.map((quiz) => {
                      // ★ Firestoreから読み込んだ結果 (bestScore)
                      const fsData = firestoreResults[quiz.id];
                      const fsCorrectCount = fsData?.correctCount ?? 0;
                      const fsTotalCount =
                        fsData?.totalCount ?? quiz.questions.length;
                      const hasAllCorrect = fsCorrectCount === fsTotalCount;

                      return (
                        <Card key={quiz.id}>
                          <CardContent>
                            <Typography variant="h6">
                              {quiz.title} {hasAllCorrect && "★"}
                            </Typography>
                            {fsData ? (
                              <>
                                <Typography variant="body2">
                                  Firestore 最大正解数: {fsCorrectCount} /{" "}
                                  {fsTotalCount}{" "}
                                </Typography>{" "}
                              </>
                            ) : (
                              <Typography variant="body1">
                                まだ解いていません
                              </Typography>
                            )}
                          </CardContent>
                          <CardActions>
                            <Button
                              variant="contained"
                              onClick={() => handleStartQuiz(quiz.id)}
                            >
                              スタート
                            </Button>
                          </CardActions>
                        </Card>
                      );
                    })}
                  </Box>
                </Card>
              </Box>
            );
          })}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default QuizSelection;
