import React, { useState } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardActions,
  CardContent,
} from "@mui/material";

// 型定義
type Values = {
  [key: string]: any;
};

function PromptGenerator({ onClose, onComplete, initialPrompt }) {
  const steps = ["文字数", "キャラクター", "口調", "回答", "難しさ"];
  const [activeStep, setActiveStep] = useState(0);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [values, setValues] = useState<Values>({
    文字数: "",
    キャラクター: "",
    "キャラクター.性格": "",
    "キャラクター.役割": "",
    口調: "",
    回答: "",
    難しさ: "",
  });
  const [selectedValues, setSelectedValues] = useState<Values>({
    文字数: "",
    "キャラクター.性格": "",
    "キャラクター.役割": "",
    口調: "",
    回答: "",
    難しさ: "",
  });

  const [isStepCompleted, setIsStepCompleted] = useState<boolean[]>(
    Array(steps.length).fill(false)
  );

  // 選択肢リスト
  const characterTraits = [
    "フレンドリーな",
    "頭のいい",
    "ユーモアのある",
    "寡黙な",
    "礼儀正しい",
    "感情的な",
    "活発な",
  ];
  const characterRoles = [
    "学生",
    "先生",
    "社長",
    "大統領",
    "犬",
    "猫",
    "ロボット",
    "宇宙人",
  ];

  // 選択肢を文章に変換するロジック
  const convertToSentence = (key, value) => {
    if (key === "キャラクター") {
      const trait = value.性格 || "未設定";
      const role = value.役割 || "未設定";

      if (trait !== "未設定" && role !== "未設定") {
        return `あなたは${trait}${role}です。`;
      } else if (trait !== "未設定") {
        return `あなたは${trait}人です。`;
      } else if (role !== "未設定") {
        return `あなたは${role}です。`;
      } else {
        return "キャラクター情報が未設定です。";
      }
    }
    const sentences = {
      文字数: {
        短め: "15文字以内の短めの文章を生成してください。",
        中程度: "30文字程度の文章を生成してください。",
        長め: "50文字以内の文章を生成してください。",
      },
      口調: {
        フォーマル: "口調はフォーマルにしてください。",
        カジュアル: "口調はカジュアルにしてください。",
        ユーモアあり: "口調はユーモアを交えたものにしてください。",
      },
      回答: {
        直接回答を誘導: "回答は相手に直接回答を誘導する形式にしてください。",
        選択肢を提供: "回答は相手に選択肢を提供してください。",
        自由回答を促す: "回答は相手に自由回答を促す形式にしてください。",
      },
      難しさ: {
        簡単: "相手への質問は簡単なものにしてください。",
        考えさせる: "相手への質問は考えさせるものにしてください。",
        クリエイティブ: "相手への質問はクリエイティブなものにしてください。",
      },
    };

    return sentences[key]?.[value] || `${key}: ${value}`;
  };

  // ステップの進行を管理する関数
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // 最後のステップの場合は完了処理を行う
      if (onComplete) {
        onComplete(prompt); // 完了時に親コンポーネントにプロンプトを渡す
      }
      onClose();
    } else {
      // それ以外の場合は次のステップに進む
      if (selectedValues[steps[activeStep]] || values[steps[activeStep]]) {
        setIsStepCompleted((prev) => {
          const newCompleted = [...prev];
          newCompleted[activeStep] = true;
          return newCompleted;
        });
      }
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => Math.max(prevActiveStep - 1, 0));
  };

  // 入力値の変更を処理
  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name.endsWith("-select")) {
      const fieldName = name.slice(0, -7);
      setSelectedValues((prev) => ({ ...prev, [fieldName]: value }));

      if (fieldName.startsWith("キャラクター")) {
        const trait =
          fieldName === "キャラクター.性格"
            ? value
            : selectedValues["キャラクター.性格"] ||
              values["キャラクター.性格"] ||
              "";
        const role =
          fieldName === "キャラクター.役割"
            ? value
            : selectedValues["キャラクター.役割"] ||
              values["キャラクター.役割"] ||
              "";

        const sentence = convertToSentence("キャラクター", {
          性格: trait,
          役割: role,
        });
        setValues((prev) => ({ ...prev, キャラクター: sentence }));
        updatePrompt("キャラクター", sentence);
      } else {
        const sentence = convertToSentence(fieldName, value);
        setValues((prev) => ({ ...prev, [fieldName]: sentence }));
        updatePrompt(fieldName, sentence);
      }
    } else if (name.endsWith("-text")) {
      const fieldName = name.slice(0, -5);
      setValues((prev) => ({ ...prev, [fieldName]: value }));
      updatePrompt(fieldName, value);
    }
  };

  // プロンプトを更新
  const updatePrompt = (key, sentence) => {
    setPrompt((prevPrompt) => {
      const lines = prevPrompt
        .split("\n")
        .filter((line) => !line.startsWith(`${key}:`));
      return [...lines, `${key}: ${sentence}`].join("\n").trim();
    });
  };

  // 各ステップのコンテンツを定義する関数
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <FormControl fullWidth>
            <InputLabel id="length-label">文字数</InputLabel>
            <Select
              labelId="length-label"
              name="文字数-select"
              value={selectedValues["文字数"]}
              onChange={handleChange}
            >
              <MenuItem value="短め（20～50文字）">短め（20～50文字）</MenuItem>
              <MenuItem value="中程度（50～100文字）">
                中程度（50～100文字）
              </MenuItem>
              <MenuItem value="長め（100文字以上）">
                長め（100文字以上）
              </MenuItem>
            </Select>
            <TextField
              label="その他（直接入力）"
              name="文字数-text"
              value={values["文字数"]}
              onChange={handleChange}
              sx={{ marginTop: 2 }}
            />
          </FormControl>
        );
      case 1:
        return (
          <>
            <FormControl fullWidth>
              <InputLabel id="character-trait-label">性格</InputLabel>
              <Select
                labelId="character-trait-label"
                name="キャラクター.性格-select"
                value={selectedValues["キャラクター.性格"]}
                onChange={handleChange}
              >
                {characterTraits.map((trait) => (
                  <MenuItem key={trait} value={trait}>
                    {trait}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ marginTop: 2 }}>
              <InputLabel id="character-role-label">役割</InputLabel>
              <Select
                labelId="character-role-label"
                name="キャラクター.役割-select"
                value={selectedValues["キャラクター.役割"]}
                onChange={handleChange}
              >
                {characterRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="キャラクター（自由記述）"
              name="キャラクター-text"
              value={values["キャラクター"]}
              onChange={handleChange}
              sx={{ marginTop: 2 }}
              fullWidth
            />
          </>
        );
      case 2:
        return (
          <FormControl fullWidth>
            <InputLabel id="tone-label">口調</InputLabel>
            <Select
              labelId="tone-label"
              name="口調-select"
              value={selectedValues["口調"]}
              onChange={handleChange}
            >
              <MenuItem value="フォーマル">フォーマル</MenuItem>
              <MenuItem value="カジュアル">カジュアル</MenuItem>
              <MenuItem value="ユーモアあり">ユーモアあり</MenuItem>
            </Select>
            <TextField
              label="その他（直接入力）"
              name="口調-text"
              value={values["口調"]}
              onChange={handleChange}
              sx={{ marginTop: 2 }}
            />
          </FormControl>
        );
      case 3:
        return (
          <FormControl fullWidth>
            <InputLabel id="response-label">回答</InputLabel>
            <Select
              labelId="response-label"
              name="回答-select"
              value={selectedValues["回答"]}
              onChange={handleChange}
            >
              <MenuItem value="直接回答を誘導">直接回答を誘導</MenuItem>
              <MenuItem value="選択肢を提供">選択肢を提供</MenuItem>
              <MenuItem value="自由回答を促す">自由回答を促す</MenuItem>
            </Select>
            <TextField
              label="その他（直接入力）"
              name="回答-text"
              value={values["回答"]}
              onChange={handleChange}
              sx={{ marginTop: 2 }}
            />
          </FormControl>
        );
      case 4:
        return (
          <FormControl fullWidth>
            <InputLabel id="difficulty-label">難しさ</InputLabel>
            <Select
              labelId="difficulty-label"
              name="難しさ-select"
              value={selectedValues["難しさ"]}
              onChange={handleChange}
            >
              <MenuItem value="簡単">簡単</MenuItem>
              <MenuItem value="考えさせる">考えさせる</MenuItem>
              <MenuItem value="クリエイティブ">クリエイティブ</MenuItem>
            </Select>
            <TextField
              label="その他（直接入力）"
              name="難しさ-text"
              value={values["難しさ"]}
              onChange={handleChange}
              sx={{ marginTop: 2 }}
            />
          </FormControl>
        );
      default:
        return "未知のステップです";
    }
  };

  return (
    <div>
      {/* Stepper */}
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{ marginBottom: 4 }}
      >
        {steps.map((label, index) => (
          <Step key={label} completed={isStepCompleted[index]}>
            <StepLabel onClick={() => setActiveStep(index)}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content Area */}
      <Card sx={{ marginBottom: 4, boxShadow: 3 }}>
        <CardContent>{getStepContent(activeStep)}</CardContent>
        <CardActions sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            戻る
          </Button>
          <Button variant="contained" color="primary" onClick={handleNext}>
            {activeStep === steps.length - 1 ? "完成！" : "次へ"}
          </Button>
        </CardActions>
      </Card>

      {/* Completed Prompt Display */}
      <Card sx={{ marginBottom: 4, backgroundColor: "#f9f9f9", boxShadow: 1 }}>
        <CardContent>
          <Typography variant="h6">編集中のプロンプト</Typography>
          <pre style={{ whiteSpace: "pre-wrap" }}>{prompt}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

export default PromptGenerator;
