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
import CheckIcon from "@mui/icons-material/Check";
import ArrowRight from "@mui/icons-material/ArrowRight";
import ArrowLeft from "@mui/icons-material/ArrowLeft";

interface PromptGeneratorProps {
  onClose: () => void;
  onComplete: (generatedPrompt: string) => void;
  initialPrompt?: string;
}

function PromptGenerator({
  onClose,
  onComplete,
  initialPrompt = "",
}: PromptGeneratorProps) {
  // ステップ定義
  const steps = ["役割", "目的", "背景", "入力", "出力", "制約"];

  const [activeStep, setActiveStep] = useState(0);
  const [isStepCompleted, setIsStepCompleted] = useState<boolean[]>(
    Array(steps.length).fill(false)
  );

  // テンプレート一覧（10個に拡張）
  const roleTemplates = [
    "あなたは医療従事者です。",
    "あなたはハリウッド映画の脚本家です。",
    "あなたは癒しの妖精です。（ちょっとファンタジーな気持ちで回答）",
    "あなたはグルメ評論家です。",
    "あなたは大学教授です。",
    "あなたは歴史学者です。",
    "あなたはITコンサルタントです。",
    "あなたは哲学者です。",
    "あなたは心理カウンセラーです。",
    "あなたはプロの音楽プロデューサーです。",
  ];

  const taskTemplates = [
    "○○について要約をお願いします。",
    "ユーザーを元気づけるようなメッセージを作成してください。",
    "次のデータからインサイトを抽出してください。",
    "面白い冗談を考えてください。（少し笑えるような内容）",
    "技術的なチュートリアルを作成してください。",
    "複雑な問題をシンプルに説明してください。",
    "5ステップで解説をしてください。",
    "読者が行動に移すように動機づけてください。",
    "エンターテイメント性のある解説をしてください。",
    "想像をかき立てるようなストーリーを作ってください。",
  ];

  const backgroundTemplates = [
    "この文章は海外旅行について説明しています。",
    "これは最新のトレンド情報に基づくデータです。",
    "この問題は子育てに関連があると想定してください。",
    "これはビジネス会議の議事録からの抜粋だと思ってください。",
    "新製品のマーケティングプランであると考えてください。",
    "歴史上の事件をベースにしてください。",
    "未来の技術についての資料です。",
    "芸術に関する文脈が含まれていると想定してください。",
    "社会問題に関する統計データであるとしてください。",
    "SFの世界観を背景として想定してください。",
  ];

  const inputTemplates = [
    "以下の文章を要約してください：『例示文…』",
    "次のリストを分析してください：●●●",
    "ここにサンプルデータを提示：～～～",
    "チャット履歴の一部を引用します：…",
    "画像の説明文があると想定してください。",
    "テキストファイルから抜粋した文として扱ってください。",
    "論文の要約版だと仮定してください。",
    "SNSの投稿文を想定してください。",
    "会議の議題リストを入力としてください。",
    "レシピの手順を入力情報にしてください。",
  ];

  const outputTemplates = [
    "箇条書きで答えてください。",
    "まず結論を述べ、続けて理由を説明してください。",
    "200文字以内に要約してください。",
    "テンション高めで回答してください！（面白おかしく）",
    "シンプルな箇条書き形式で回答してください。",
    "画像イメージが浮かぶような描写で答えてください。",
    "学生向けに分かりやすく答えてください。",
    "専門家向けに専門用語を使いつつ回答してください。",
    "物語形式で回答してください。",
    "優しい口調で励ますように回答してください。",
  ];

  const cautionTemplates = [
    "専門用語はできるだけ使わないでください。",
    "ネタバレはしないでください。",
    "誤情報は書かないようにしてください。",
    "特定の個人情報については伏せてください。",
    "差別的表現は避けてください。",
    "著作権に違反しないようにしてください。",
    "法律的に問題がない表現を心がけてください。",
    "過度に暴力的な表現は避けてください。",
    "公序良俗に反しないようにしてください。",
    "プライバシーに配慮した表現をしてください。",
  ];

  // 各入力用ステート
  const [roleInput, setRoleInput] = useState("");
  const [roleTemplate, setRoleTemplate] = useState("");

  const [taskInput, setTaskInput] = useState("");
  const [taskTemplate, setTaskTemplate] = useState("");

  const [backgroundInput, setBackgroundInput] = useState("");
  const [backgroundTemplate, setBackgroundTemplate] = useState("");

  const [inputExample, setInputExample] = useState("");
  const [inputTemplate, setInputTemplate] = useState("");

  const [outputInput, setOutputInput] = useState("");
  const [outputTemplate, setOutputTemplate] = useState("");

  const [cautionInput, setCautionInput] = useState("");
  const [cautionTemplate, setCautionTemplate] = useState("");

  // プロンプト全体を管理するステート
  const [prompt, setPrompt] = useState(initialPrompt);

  // テンプレートが選択された際、入力欄に反映
  const handleSelectTemplate = (
    templateValue: string,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setInput(templateValue);
  };

  // プロンプトを組み立てる関数
  const buildPrompt = () => {
    const generatedPrompt = [
      roleInput ? `【役割・視点】${roleInput}` : "",
      taskInput ? `【タスク・目的】${taskInput}` : "",
      backgroundInput ? `【背景情報・前提知識】${backgroundInput}` : "",
      inputExample ? `【入力・例示】${inputExample}` : "",
      outputInput ? `【出力・回答】${outputInput}` : "",
      cautionInput ? `【制約・条件・注意点】${cautionInput}` : "",
    ]
      .filter((item) => item.trim() !== "")
      .join("\n\n");

    setPrompt(generatedPrompt);
  };

  // ステップの進行を管理
  const handleNext = () => {
    // 現在ステップの入力が終わったらcompleted扱い
    setIsStepCompleted((prev) => {
      const newCompleted = [...prev];
      newCompleted[activeStep] = true;
      return newCompleted;
    });

    // 入力値をもとに都度プロンプトを組み立て
    buildPrompt();

    if (activeStep < steps.length) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => Math.max(prevActiveStep - 1, 0));
  };

  // 最終的にonCompleteを呼ぶ
  const handleSave = () => {
    onComplete(prompt);
    onClose();
  };

  // 各ステップのUI（説明から例を削除し、タイトルと説明をカードでまとめる）
  const getStepContent = (stepNumber: number) => {
    switch (stepNumber) {
      case 0: // 役割・視点
        return (
          <Card sx={{ marginBottom: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                【役割・視点】
              </Typography>
              <Typography variant="body2" paragraph>
                テキスト生成モデルとのやり取り上、回答者にどのような立場/役割/専門性を持たせたいかを指定します。
                聞き手の立場/役割/専門性も指定することができます。
              </Typography>

              <FormControl fullWidth>
                <InputLabel>テンプレートから選択</InputLabel>
                <Select
                  value={roleTemplate}
                  onChange={(e) => {
                    setRoleTemplate(e.target.value);
                    handleSelectTemplate(e.target.value, setRoleInput);
                  }}
                >
                  {roleTemplates.map((template, idx) => (
                    <MenuItem key={idx} value={template}>
                      {template}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  label="【役割・視点】自由記述"
                  multiline
                  fullWidth
                  sx={{ marginTop: 2 }}
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                />
              </FormControl>
            </CardContent>
          </Card>
        );
      case 1: // タスク・目的
        return (
          <Card sx={{ marginBottom: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                【タスク・目的】
              </Typography>
              <Typography variant="body2" paragraph>
                このプロンプトで達成すべきゴールや、求めている回答・行動を明確にします。
              </Typography>

              <FormControl fullWidth>
                <InputLabel>テンプレートから選択</InputLabel>
                <Select
                  value={taskTemplate}
                  onChange={(e) => {
                    setTaskTemplate(e.target.value);
                    handleSelectTemplate(e.target.value, setTaskInput);
                  }}
                >
                  {taskTemplates.map((template, idx) => (
                    <MenuItem key={idx} value={template}>
                      {template}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  label="【タスク・目的】自由記述"
                  multiline
                  fullWidth
                  sx={{ marginTop: 2 }}
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                />
              </FormControl>
            </CardContent>
          </Card>
        );
      case 2: // 背景情報・前提知識
        return (
          <Card sx={{ marginBottom: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                【背景情報・前提知識】
              </Typography>
              <Typography variant="body2" paragraph>
                解決したい問題やタスクに関連する前提条件や背景事情、参考になる情報を提供します。
              </Typography>

              <FormControl fullWidth>
                <InputLabel>テンプレートから選択</InputLabel>
                <Select
                  value={backgroundTemplate}
                  onChange={(e) => {
                    setBackgroundTemplate(e.target.value);
                    handleSelectTemplate(e.target.value, setBackgroundInput);
                  }}
                >
                  {backgroundTemplates.map((template, idx) => (
                    <MenuItem key={idx} value={template}>
                      {template}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  label="【背景情報・前提知識】自由記述"
                  multiline
                  fullWidth
                  sx={{ marginTop: 2 }}
                  value={backgroundInput}
                  onChange={(e) => setBackgroundInput(e.target.value)}
                />
              </FormControl>
            </CardContent>
          </Card>
        );
      case 3: // 入力・例示
        return (
          <Card sx={{ marginBottom: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                【入力・例示】
              </Typography>
              <Typography variant="body2" paragraph>
                モデルに処理させたいテキスト、サンプルデータ、すでに得られている情報やヒントを提示します。
              </Typography>

              <FormControl fullWidth>
                <InputLabel>テンプレートから選択</InputLabel>
                <Select
                  value={inputTemplate}
                  onChange={(e) => {
                    setInputTemplate(e.target.value);
                    handleSelectTemplate(e.target.value, setInputExample);
                  }}
                >
                  {inputTemplates.map((template, idx) => (
                    <MenuItem key={idx} value={template}>
                      {template}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  label="【入力・例示】自由記述"
                  multiline
                  fullWidth
                  sx={{ marginTop: 2 }}
                  value={inputExample}
                  onChange={(e) => setInputExample(e.target.value)}
                />
              </FormControl>
            </CardContent>
          </Card>
        );
      case 4: // 出力・回答
        return (
          <Card sx={{ marginBottom: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                【出力・回答】
              </Typography>
              <Typography variant="body2" paragraph>
                仕上がりの形式、文章のトーン、段落構成、分量などを指定します。
              </Typography>

              <FormControl fullWidth>
                <InputLabel>テンプレートから選択</InputLabel>
                <Select
                  value={outputTemplate}
                  onChange={(e) => {
                    setOutputTemplate(e.target.value);
                    handleSelectTemplate(e.target.value, setOutputInput);
                  }}
                >
                  {outputTemplates.map((template, idx) => (
                    <MenuItem key={idx} value={template}>
                      {template}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  label="【出力・回答】自由記述"
                  multiline
                  fullWidth
                  sx={{ marginTop: 2 }}
                  value={outputInput}
                  onChange={(e) => setOutputInput(e.target.value)}
                />
              </FormControl>
            </CardContent>
          </Card>
        );
      case 5: // 制約・条件・注意点
        return (
          <Card sx={{ marginBottom: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                【制約・条件・注意点】
              </Typography>
              <Typography variant="body2" paragraph>
                使用できる手法やツール、守らなければならないルールや留意点などを示します。
                間違えやすいポイント、禁止事項、避けてほしい内容などがあれば明示します。
              </Typography>

              <FormControl fullWidth>
                <InputLabel>テンプレートから選択</InputLabel>
                <Select
                  value={cautionTemplate}
                  onChange={(e) => {
                    setCautionTemplate(e.target.value);
                    handleSelectTemplate(e.target.value, setCautionInput);
                  }}
                >
                  {cautionTemplates.map((template, idx) => (
                    <MenuItem key={idx} value={template}>
                      {template}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  label="【制約・条件・注意点】自由記述"
                  multiline
                  fullWidth
                  sx={{ marginTop: 2 }}
                  value={cautionInput}
                  onChange={(e) => setCautionInput(e.target.value)}
                />
              </FormControl>
            </CardContent>
          </Card>
        );
      default:
        return <Typography>未知のステップです</Typography>;
    }
  };

  return (
    <div>
      {/* ステッパー */}
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

      {activeStep < steps.length ? (
        <>
          {/* 各ステップのカード（タイトル・説明・入力フォーム） */}
          {getStepContent(activeStep)}

          {/* ボタン操作 */}
          <CardActions
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowLeft />}
            >
              戻る
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              endIcon={
                activeStep === steps.length - 1 ? <CheckIcon /> : <ArrowRight />
              }
            >
              {activeStep === steps.length - 1 ? "完成！" : "次へ"}
            </Button>
          </CardActions>

          {/* プロンプト表示（編集中） */}
          <Card
            sx={{ marginTop: 4, marginBottom: 4, backgroundColor: "#f9f9f9" }}
          >
            <CardContent>
              <Typography variant="h6">編集中のプロンプト</Typography>
              <pre style={{ whiteSpace: "pre-wrap" }}>{prompt}</pre>
            </CardContent>
          </Card>
        </>
      ) : (
        <div>
          <Typography variant="h5">プロンプト完成！</Typography>

          <Card
            sx={{
              marginBottom: 4,
              backgroundColor: "#f9f9f9",
              boxShadow: 1,
              marginTop: 2,
            }}
          >
            <CardContent>
              <Typography variant="h6">生成したプロンプト</Typography>
              <Typography variant="body1" color="text.secondary">
                自由に編集ができます
              </Typography>

              <TextField
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                fullWidth
                multiline
                rows={6}
                variant="outlined"
                sx={{ marginTop: 2 }}
              />
            </CardContent>
            <CardActions
              sx={{ display: "flex", justifyContent: "space-between" }}
            >
              <Button variant="outlined" color="secondary" onClick={onClose}>
                閉じる
              </Button>
              <Button variant="contained" color="primary" onClick={handleSave}>
                保存
              </Button>
            </CardActions>
          </Card>
        </div>
      )}
    </div>
  );
}

export default PromptGenerator;
