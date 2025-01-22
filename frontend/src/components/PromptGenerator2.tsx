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
  // ───────────────────────────────────────
  // 最初の4つ: 一般的な実用的なプロンプト
  // 次の3つ: チューリングテストにて有用なもの
  // 最後の3つ: ユーモアに富んだプロンプト
  // ───────────────────────────────────────

  const roleTemplates = [
    // 一般的な実用（4）
    "あなたは弁護士として、法律相談に的確に答えます。",
    "あなたは調理師として、レシピを提案します。",
    "あなたは医師として、健康アドバイスをします。",
    "あなたは建築家として、家の設計についてアドバイスします。",
    // チューリングテスト有用（3）
    "あなたは人間のように自然な会話ができます。",
    "あなたは感情表現を使いながら、相手を安心させる話し方ができます。",
    "あなたは推論能力を用いて、複雑な質問にも自然に答えることができます。",
    // ユーモア（3）
    "あなたはお笑い芸人のようなユーモアを交えて会話します。",
    "あなたはダジャレや小ネタを織り交ぜて楽しませます。",
    "あなたはコメディ映画のキャラクターのように面白く受け答えします。",
  ];

  const taskTemplates = [
    // 一般的な実用（4）
    "営業成績を向上させるためのアドバイスをください。",
    "複雑なアイデアをわかりやすくまとめてください。",
    "健康な生活を送るための指針を示してください。",
    "新規ビジネスの企画を考えてください。",
    // チューリングテスト有用（3）
    "自然な会話の中で人間らしいリアクションを見せてください。",
    "少し曖昧な質問に対しても的確に意図を汲み取って答えてください。",
    "対話の流れを読み取り、先回りして質問を理解してください。",
    // ユーモア（3）
    "親しい友人と雑談するようなユーモアを混ぜて返答してください。",
    "読者をくすっと笑わせるような言い回しを考えてください。",
    "面白い例え話を使って回答してください。",
  ];

  const backgroundTemplates = [
    // 一般的な実用（4）
    "このレポートは医療分野の研究結果をもとにしています。",
    "国際会議で発表された新しいマーケティング手法の話を想定してください。",
    "大企業が行った市場調査データがあります。",
    "小規模コミュニティにおけるアンケート結果から見た課題を想定してください。",
    // チューリングテスト有用（3）
    "人間同士の会話のようにスムーズに内容を共有する必要があります。",
    "自然言語で得られたフィードバックを整理する前提になっています。",
    "リアルタイムに質問と回答を繰り返すやり取りを想定してください。",
    // ユーモア（3）
    "実は猫がキーボードを打っているという設定で想定してください。",
    "駄洒落好きな研究者が書いた文献だと思ってください。",
    "エイプリルフールに発表された架空のデータとして扱ってください。",
  ];

  const inputTemplates = [
    // 一般的な実用（4）
    "以下の顧客アンケート結果を入力資料としてください。",
    "次のテキストデータを要約してください：…",
    "会話ログをここに貼りますので、その概要をまとめてください。",
    "PDFマニュアルの要点を抽出したテキストを参考にしてください。",
    // チューリングテスト有用（3）
    "これは、人間とAIの対話ログの抜粋です。",
    "応答精度を評価するためのQAペアが入力となります。",
    "チャットセッションの途中から参加し、前後の文脈を想定してください。",
    // ユーモア（3）
    "ユーモア満載のブログ記事の一部を入力とします。",
    "芸人がステージで語ったトーク内容の文字起こしです。",
    "クスッと笑える謎解きクイズの本文を引用します。",
  ];

  const outputTemplates = [
    // 一般的な実用（4）
    "常体で簡潔にまとめてください。",
    "敬体で丁寧な文章を心がけてください。",
    "重要な点を箇条書きで列挙してください。",
    "論理構成が分かりやすいように章立てしてください。",
    // チューリングテスト有用（3）
    "自然で感情豊かな会話を再現してください。",
    "人間らしい思考過程をにじませつつ回答してください。",
    "相手の意図をくみ取って補足質問や確認を行ってください。",
    // ユーモア（3）
    "面白いオチをつけて締めくくってください。",
    "冗談を交えつつ気軽に回答してください。",
    "読者が笑える例え話をふんだんに使って説明してください。",
  ];

  const cautionTemplates = [
    // 一般的な実用（4）
    "個人情報は含めないように配慮してください。",
    "過度に専門用語を使いすぎないように注意してください。",
    "事実と意見を明確に区別してください。",
    "著作権や引用のルールを守ってください。",
    // チューリングテスト有用（3）
    "人間らしく自然に受け答えができるように、メタ情報は出しすぎないでください。",
    "あいまいな質問には再確認のプロセスを行ってください。",
    "機械であることを直接明かさない程度に自分の思考を説明してください。",
    // ユーモア（3）
    "下品なジョークは控えてください。",
    "小さなミスも笑いに変えるような柔軟さを心がけてください。",
    "状況にそぐわないブラックユーモアは避けてください。",
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
    // そのまま入力欄に反映
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

  // 各ステップのUI（タイトルと説明をカードでまとめる）
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
