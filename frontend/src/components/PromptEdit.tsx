import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  Box,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Container,
  CssBaseline,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  SelectChangeEvent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { AIModel, BotSetting, BotData, GPTMessage } from "../shared/types.ts";
import { updateUserProfile } from "../services/firestore-database_f.ts";
import { generateChat } from "../services/chatGPT_f.ts";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PromptGenerator from "../components/PromptGenerator.tsx";
import { Add as AddIcon } from "@mui/icons-material";
import SaveIcon from "@mui/icons-material/Save"; // 保存アイコン
import EditIcon from "@mui/icons-material/Edit"; // プロンプト編集のアイコン
import SettingsIcon from "@mui/icons-material/Settings"; // 設定セクションのアイコン
import ChatIcon from "@mui/icons-material/Chat"; // テストチャットセクションのアイコン
import PersonIcon from "@mui/icons-material/Person"; // ユーザーのアイコン
import SmartToyIcon from "@mui/icons-material/SmartToy"; // ボットのアイコン
import Avatar from "@mui/material/Avatar"; // Avatarコンポーネント
import ListItemAvatar from "@mui/material/ListItemAvatar"; // リストアイテム内でAvatarを配置するコンポーネント

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

const EditPromptView: React.FC = () => {
  const bots: BotData = useLocation().state;
  const navigate = useNavigate();

  // 初期選択ボットの設定
  const initialBot =
    bots.data.find((bot) => bot.id === bots.defaultId) || bots.data[0];

  // 状態変数の定義
  const [botSettings, setBotSettings] = useState<BotSetting[]>(bots.data);
  const [defaultBotId, setDefaultBotId] = useState<number>(bots.defaultId);
  const [selectedBotId, setSelectedBotId] = useState<number>(initialBot.id);
  const [prompt, setPrompt] = useState<string>(initialBot.prompt);
  const [botName, setBotName] = useState<string>(initialBot.name);
  const [model, setModel] = useState<AIModel>(initialBot.model);
  const [creativity, setCreativity] = useState<number>(initialBot.temperature);
  const [certainty, setCertainty] = useState<number>(initialBot.top_p);
  const [isPromptSaveEnabled, setIsPromptSaveEnabled] =
    useState<boolean>(false);
  const [isSettingsSaveEnabled, setIsSettingsSaveEnabled] =
    useState<boolean>(false);

  // テストチャット用の状態変数
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<GPTMessage[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);

  // ボット選択変更時の処理
  const handleBotSelection = (event: SelectChangeEvent<number>) => {
    const value = parseInt(event.target.value as string, 10);
    const selectedBot = botSettings.find((bot) => bot.id === value);
    if (selectedBot) {
      setSelectedBotId(selectedBot.id);
      setPrompt(selectedBot.prompt);
      setBotName(selectedBot.name);
      setModel(selectedBot.model);
      setCreativity(selectedBot.temperature);
      setCertainty(selectedBot.top_p);
      setIsPromptSaveEnabled(false);
      setIsSettingsSaveEnabled(false);
      setChatHistory([]); // チャット履歴をリセット
    }
  };

  //#region プロンプト編集ダイアログ
  const [openGeneratePrompt, setOpenGeneratePrompt] = useState(false);

  const handleOpenGeneratePrompt = () => {
    setOpenGeneratePrompt(true);
  };

  const handleCloseGeneratePrompt = () => {
    setOpenGeneratePrompt(false);
  };

  // プロンプトが完成したときの処理
  const handleCompleteGeneratePrompt = (generatedPrompt) => {
    setPrompt(prompt + "\n" + generatedPrompt); // 完成したプロンプトを保存
    console.log("プロンプトを更新:", prompt); // 必要に応じてログ出力
  };

  //#endregion

  // プロンプト保存処理
  const handlePromptSave = () => {
    const updatedBotSettings = botSettings.map((bot) =>
      bot.id === selectedBotId ? { ...bot, name: botName, prompt: prompt } : bot
    );
    setBotSettings(updatedBotSettings);
    updateUserProfile({
      bots: {
        defaultId: defaultBotId,
        data: updatedBotSettings,
      },
    });
    setIsPromptSaveEnabled(false);
  };

  // 設定保存処理
  const handleSettingsSave = () => {
    const updatedBotSettings = botSettings.map((bot) =>
      bot.id === selectedBotId
        ? { ...bot, model: model, temperature: creativity, top_p: certainty }
        : bot
    );
    setBotSettings(updatedBotSettings);
    updateUserProfile({
      bots: {
        defaultId: defaultBotId,
        data: updatedBotSettings,
      },
    });
    setIsSettingsSaveEnabled(false);
  };

  // デフォルトに設定処理
  const handleSetDefault = () => {
    setDefaultBotId(selectedBotId);
    updateUserProfile({
      bots: {
        defaultId: selectedBotId,
        data: botSettings,
      },
    });
  };

  // チャットメッセージ送信処理
  const handleSendMessage = async () => {
    if (chatMessage.trim() !== "") {
      const userMessage: GPTMessage = {
        role: "user",
        content: chatMessage,
      };
      setChatHistory((prev) => [...prev, userMessage]);
      setChatMessage("");
      setIsSending(true);
    }
  };

  // AIからの応答処理
  useEffect(() => {
    const sendChatMessage = async () => {
      const filteredMessages = chatHistory.filter(
        (message) => message.role !== "system"
      );
      const responseContent = await generateChat(filteredMessages);
      const aiMessage: GPTMessage = {
        role: "assistant",
        content: responseContent,
      };
      setChatHistory((prev) => [...prev, aiMessage]);
      setIsSending(false);
    };

    if (isSending) {
      sendChatMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSending]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* AppBar */}
      <AppBar position="static" sx={{ mb: 4 }}>
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
            プロンプト編集
          </Typography>
        </Toolbar>
      </AppBar>

      {/* メインコンテンツ */}
      <Container maxWidth="md">
        <Box mt={4}>
          {/* 保存されているプロンプト */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SaveIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5">保存されているプロンプト</Typography>
              </Box>
              <FormControl fullWidth>
                <InputLabel>プロンプト選択</InputLabel>
                <Select
                  value={selectedBotId}
                  onChange={handleBotSelection}
                  fullWidth
                >
                  {botSettings.map((bot) => (
                    <MenuItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleSetDefault}
                disabled={defaultBotId === selectedBotId}
              >
                {defaultBotId === selectedBotId
                  ? "デフォルトに設定中"
                  : "デフォルトに設定"}
              </Button>
            </CardActions>
          </Card>

          {/* プロンプト編集 */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <EditIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5">プロンプト編集</Typography>
              </Box>
              <TextField
                label="ボット名"
                value={botName}
                onChange={(e) => {
                  setBotName(e.target.value);
                  setIsPromptSaveEnabled(true);
                }}
                fullWidth
                sx={{ mt: 2 }}
              />
              <TextField
                label="プロンプト"
                multiline
                rows={4}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setIsPromptSaveEnabled(true);
                }}
                fullWidth
                sx={{ mt: 2 }}
              />
            </CardContent>
            <CardActions>
              <Box display="flex" justifyContent="space-between" width="100%">
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleOpenGeneratePrompt}
                  startIcon={<AddIcon />}
                >
                  テンプレートから作成
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!isPromptSaveEnabled}
                  onClick={handlePromptSave}
                >
                  保存
                </Button>
              </Box>
            </CardActions>
          </Card>

          {/* 設定 */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SettingsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5">設定</Typography>
              </Box>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>モデル</InputLabel>
                <Select
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value as AIModel);
                    setIsSettingsSaveEnabled(true);
                  }}
                >
                  <MenuItem value={AIModel["gpt-4o"]}>GPT-4o</MenuItem>
                  <MenuItem value={AIModel["gpt-4o-mini"]}>
                    GPT-4o mini
                  </MenuItem>
                  <MenuItem value={AIModel["gpt-4"]}>GPT-4</MenuItem>
                </Select>
              </FormControl>
              <Box mt={2}>
                <Typography gutterBottom>創造性</Typography>
                <Slider
                  value={creativity}
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={(e, value) => {
                    setCreativity(value as number);
                    setIsSettingsSaveEnabled(true);
                  }}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box mt={2}>
                <Typography gutterBottom>確実性</Typography>
                <Slider
                  value={certainty}
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={(e, value) => {
                    setCertainty(value as number);
                    setIsSettingsSaveEnabled(true);
                  }}
                  valueLabelDisplay="auto"
                />
              </Box>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                disabled={!isSettingsSaveEnabled}
                onClick={handleSettingsSave}
              >
                保存
              </Button>
            </CardActions>
          </Card>

          {/* テストチャット */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ChatIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5">テストチャット</Typography>
              </Box>
              <Box
                sx={{
                  maxHeight: 300,
                  overflowY: "auto",
                  border: "1px solid #ccc",
                  padding: 2,
                }}
              >
                <List>
                  {chatHistory.map((message, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            {message.role === "user" ? (
                              <PersonIcon />
                            ) : (
                              <SmartToyIcon />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              color={
                                message.role === "user"
                                  ? "primary"
                                  : "secondary"
                              }
                            >
                              {message.role === "user" ? "あなた" : botName}
                            </Typography>
                          }
                          secondary={message.content}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                  {isSending && (
                    <ListItem>
                      <CircularProgress size={24} />
                      <ListItemText primary="応答を生成中..." sx={{ ml: 2 }} />
                    </ListItem>
                  )}
                </List>
              </Box>
              <Box mt={2} display="flex">
                <TextField
                  label="メッセージを入力"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={isSending || !chatMessage.trim()}
                  sx={{ ml: 2 }}
                >
                  送信
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default EditPromptView;
