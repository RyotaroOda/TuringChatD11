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
} from "@mui/material";

function PromptGenerator({ onClose, onComplete }) {
  const steps = ["文字数", "キャラクター", "口調", "回答", "難しさ"];
  const [activeStep, setActiveStep] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [values, setValues] = useState({
    文字数: "",
    キャラクター: "",
    口調: "",
    回答: "",
    難しさ: "",
  });
  const [completed, setCompleted] = useState({});

  // ステップの進行を管理する関数
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // 最後のステップでは完成画面に遷移
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else {
      // 通常の進行処理
      const newCompleted = { ...completed };
      if (values[steps[activeStep]]) {
        newCompleted[activeStep] = true;
      }
      setCompleted(newCompleted);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => Math.max(prevActiveStep - 1, 0));
  };

  const handleSkip = () => {
    if (activeStep === steps.length - 1) {
      // 最後のステップでスキップされた場合も完成画面へ遷移
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  // 入力値の変更を処理する関数
  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
    updatePrompt(name, value);
  };

  // プロンプトを更新する関数
  const updatePrompt = (name, value) => {
    setPrompt((prevPrompt) => {
      const lines = prevPrompt
        .split("\n")
        .filter((line) => !line.startsWith(`${name}：`));
      return [...lines, `${name}：${value}`].join("\n");
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
              name="文字数"
              value={values["文字数"]}
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
              name="文字数"
              value={values["文字数"]}
              onChange={handleChange}
              style={{ marginTop: "1em" }}
            />
          </FormControl>
        );
      case 1:
        return (
          <FormControl fullWidth>
            <InputLabel id="character-label">キャラクター</InputLabel>
            <Select
              labelId="character-label"
              name="キャラクター"
              value={values["キャラクター"]}
              onChange={handleChange}
            >
              <MenuItem value="フレンドリーな雑談相手">
                フレンドリーな雑談相手
              </MenuItem>
              <MenuItem value="知識を持った専門家">知識を持った専門家</MenuItem>
              <MenuItem value="質問好きなインタビュアー">
                質問好きなインタビュアー
              </MenuItem>
              <MenuItem value="遊び心のあるゲームマスター">
                遊び心のあるゲームマスター
              </MenuItem>
            </Select>
            <TextField
              label="その他（直接入力）"
              name="キャラクター"
              value={values["キャラクター"]}
              onChange={handleChange}
              style={{ marginTop: "1em" }}
            />
          </FormControl>
        );
      case 2:
        return (
          <FormControl fullWidth>
            <InputLabel id="tone-label">口調</InputLabel>
            <Select
              labelId="tone-label"
              name="口調"
              value={values["口調"]}
              onChange={handleChange}
            >
              <MenuItem value="フォーマル">フォーマル</MenuItem>
              <MenuItem value="カジュアル">カジュアル</MenuItem>
              <MenuItem value="ユーモアあり">ユーモアあり</MenuItem>
            </Select>
            <TextField
              label="その他（直接入力）"
              name="口調"
              value={values["口調"]}
              onChange={handleChange}
              style={{ marginTop: "1em" }}
            />
          </FormControl>
        );
      case 3:
        return (
          <FormControl fullWidth>
            <InputLabel id="response-label">回答</InputLabel>
            <Select
              labelId="response-label"
              name="回答"
              value={values["回答"]}
              onChange={handleChange}
            >
              <MenuItem value="直接回答を誘導">直接回答を誘導</MenuItem>
              <MenuItem value="選択肢を提供">選択肢を提供</MenuItem>
              <MenuItem value="自由回答を促す">自由回答を促す</MenuItem>
            </Select>
            <TextField
              label="その他（直接入力）"
              name="回答"
              value={values["回答"]}
              onChange={handleChange}
              style={{ marginTop: "1em" }}
            />
          </FormControl>
        );
      case 4:
        return (
          <FormControl fullWidth>
            <InputLabel id="difficulty-label">難しさ</InputLabel>
            <Select
              labelId="difficulty-label"
              name="難しさ"
              value={values["難しさ"]}
              onChange={handleChange}
            >
              <MenuItem value="簡単">簡単</MenuItem>
              <MenuItem value="考えさせる">考えさせる</MenuItem>
              <MenuItem value="クリエイティブ">クリエイティブ</MenuItem>
            </Select>
            <TextField
              label="その他（直接入力）"
              name="難しさ"
              value={values["難しさ"]}
              onChange={handleChange}
              style={{ marginTop: "1em" }}
            />
          </FormControl>
        );
      default:
        return "未知のステップです";
    }
  };

  return (
    <div>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={label} completed={completed[index]}>
            <StepLabel onClick={() => setActiveStep(index)}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div style={{ margin: "2em 0" }}>
        {activeStep < steps.length ? (
          <>
            {getStepContent(activeStep)}
            <div
              style={{
                marginTop: "2em",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Button disabled={activeStep === 0} onClick={handleBack}>
                戻る
              </Button>
              <div>
                {values[steps[activeStep]] ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                  >
                    次へ
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleSkip}
                  >
                    スキップ
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div>
            <Typography variant="h5">プロンプト完成！</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              variant="outlined"
              style={{ marginTop: "1em" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "1em",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  if (onComplete) {
                    onComplete(prompt); // 完了時に親コンポーネントにpromptを渡す
                  }
                  onClose();
                }}
              >
                終了
              </Button>
            </div>
          </div>
        )}
      </div>
      <div>
        <Typography variant="h6">編集中のプロンプト：</Typography>
        <pre style={{ backgroundColor: "#f0f0f0", padding: "1em" }}>
          {prompt}
        </pre>
      </div>
    </div>
  );
}

export default PromptGenerator;
