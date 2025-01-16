import React, { createContext, useContext, useState } from "react";

export type QuizResult = {
  quizId: string;
  correctCount: number;
  totalCount: number;
  hasAllCorrect: boolean; // 全問正解経験があるかどうか
};

type QuizContextType = {
  results: QuizResult[];
  updateQuizResult: (
    quizId: string,
    correctCount: number,
    totalCount: number
  ) => void;
};

const QuizContext = createContext<QuizContextType>({
  results: [],
  updateQuizResult: () => {},
});

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [results, setResults] = useState<QuizResult[]>([]);

  const updateQuizResult = (
    quizId: string,
    correctCount: number,
    totalCount: number
  ) => {
    setResults((prev) => {
      const existing = prev.find((r) => r.quizId === quizId);

      // すでに保存していた場合、正解数が前回より多い場合に更新し、
      // 全問正解フラグ(hasAllCorrect)もチェック
      if (existing) {
        const newCorrectCount = Math.max(existing.correctCount, correctCount);
        const hasAllCorrect =
          existing.hasAllCorrect || correctCount === totalCount;
        return prev.map((r) =>
          r.quizId === quizId
            ? {
                quizId,
                correctCount: newCorrectCount,
                totalCount,
                hasAllCorrect,
              }
            : r
        );
      } else {
        // 新規
        const hasAllCorrect = correctCount === totalCount;
        return [...prev, { quizId, correctCount, totalCount, hasAllCorrect }];
      }
    });
  };

  return (
    <QuizContext.Provider value={{ results, updateQuizResult }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuizContext = () => useContext(QuizContext);
