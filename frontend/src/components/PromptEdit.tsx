import React, { useEffect, useState, useRef } from "react";
import PromptGenerator from "./PromptGenerator.tsx";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  Box,
  Card,
  CardContent,
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
  CircularProgress,
  Avatar,
  ListItemAvatar,
  Fab,
  Drawer,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  SelectChangeEvent,
  CardActions,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { AIModel, BotData, GPTMessage } from "../shared/types.ts";
import { generateChat } from "../services/chatGPT_f.ts";
import ChatIcon from "@mui/icons-material/Chat";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import Fade from "@mui/material/Fade";
import CheckIcon from "@mui/icons-material/Check";
import { updateUserProfile } from "../services/firestore-database_f.ts";

const theme = createTheme({
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

const EditPromptView: React.FC = () => {
  const bots: BotData = useLocation().state;
  const navigate = useNavigate();

  // State variables

  const [defaultBotId, setDefaultBotId] = useState<number>(bots.defaultId);
  const [selectedBotId, setSelectedBotId] = useState<number>(
    bots.defaultId || bots.data[0].id
  );

  const [botSettings, setBotSettings] = useState(bots.data);
  const [prompt, setPrompt] = useState<string>(bots.data[0].prompt);
  const [botName, setBotName] = useState<string>(bots.data[0].name);
  const [model, setModel] = useState<AIModel>(bots.data[0].model);
  const [creativity, setCreativity] = useState<number>(
    bots.data[0].temperature
  );
  const [certainty, setCertainty] = useState<number>(bots.data[0].top_p);
  const [isPromptSaveEnabled, setIsPromptSaveEnabled] =
    useState<boolean>(false);
  const [isSettingsSaveEnabled, setIsSettingsSaveEnabled] =
    useState<boolean>(false);

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

  //#region チャット
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<GPTMessage[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // チャットの最後にスクロールする処理
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // メッセージを送信する処理
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

  // メッセージ送信とAIの応答を処理するエフェクト
  useEffect(() => {
    const sendChatMessage = async () => {
      try {
        const filteredMessages = chatHistory.filter(
          (message) => message.role !== "system"
        );
        const responseContent = await generateChat(filteredMessages);
        const aiMessage: GPTMessage = {
          role: "assistant",
          content: responseContent,
        };
        setChatHistory((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error generating chat response: ", error);
      } finally {
        setIsSending(false);
      }
    };

    if (isSending) {
      sendChatMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSending]);

  // チャット履歴が更新されたときに自動で下にスクロールするエフェクト
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // ドロワーの開閉を制御する処理
  const toggleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  //#endregion

  //#region プロンプト編集ダイアログ
  const [openGeneratePrompt, setOpenGeneratePrompt] = useState(false);

  const handleOpenGeneratePrompt = () => {
    setOpenGeneratePrompt(true);
  };

  const handleCloseGeneratePrompt = () => {
    const confirmClose = window.confirm(
      "編集内容が保存されていません。閉じてもよろしいですか？"
    );
    if (!confirmClose) return;

    setOpenGeneratePrompt(false);
  };

  // プロンプトが完成したときの処理
  const handleCompleteGeneratePrompt = (generatedPrompt) => {
    setPrompt(generatedPrompt); // 完成したプロンプトを保存
    console.log("プロンプトを更新:", prompt); // 必要に応じてログ出力
  };
  //#endregion

  //#region 保存
  const [isPromptSaving, setIsPromptSaving] = useState(false);
  const [isPromptSaved, setIsPromptSaved] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);

  // プロンプト保存処理
  const handlePromptSave = async () => {
    setIsPromptSaving(true); // ロード中状態にする
    const updatedBotSettings = botSettings.map((bot) =>
      bot.id === selectedBotId ? { ...bot, name: botName, prompt: prompt } : bot
    );
    setBotSettings(updatedBotSettings);
    await updateUserProfile({
      bots: {
        defaultId: defaultBotId,
        data: updatedBotSettings,
      },
    });
    setIsPromptSaveEnabled(false);
    setIsPromptSaving(false); // ロード終了
    setIsPromptSaved(true); // 保存完了状態にする
    setTimeout(() => {
      setIsPromptSaved(false); // 数秒後に元に戻す
    }, 1000);
  };

  // 設定保存処理
  const handleSettingsSave = async () => {
    setIsSettingsSaving(true); // ロード中状態にする
    const updatedBotSettings = botSettings.map((bot) =>
      bot.id === selectedBotId
        ? { ...bot, model: model, temperature: creativity, top_p: certainty }
        : bot
    );
    setBotSettings(updatedBotSettings);
    await updateUserProfile({
      bots: {
        defaultId: defaultBotId,
        data: updatedBotSettings,
      },
    });
    setIsSettingsSaveEnabled(false);
    setIsSettingsSaving(false); // ロード終了
    setIsSettingsSaved(true); // 保存完了状態にする
    setTimeout(() => {
      setIsSettingsSaved(false); // 数秒後に元に戻す
    }, 2000);
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
  //#endregion

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* AppBar with navigation */}
      <AppBar position="static" sx={{ mb: 4 }}>
        <Toolbar>
          <Button
            variant="outlined"
            color="inherit"
            sx={{
              textTransform: "none",
              borderColor: "#ffffff",
              color: "#ffffff",
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
      {/* Main Content */}
      <Container maxWidth="md">
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
          <CardActions
            sx={{
              display: "flex",
              justifyContent: "center",
            }}
          >
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
            <Box
              display="flex"
              alignItems="center"
              mb={2}
              justifyContent="space-between"
            >
              <Typography variant="h5">
                {" "}
                <EditIcon color="primary" sx={{ mr: 1 }} />
                プロンプト編集
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleOpenGeneratePrompt}
                startIcon={<AddIcon />}
              >
                テンプレートから作成
              </Button>
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
          <CardActions
            sx={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            {" "}
            <Box sx={{ position: "relative" }}>
              <Fade in={!isPromptSaving && !isPromptSaved}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!isPromptSaveEnabled || isPromptSaving}
                  onClick={handlePromptSave}
                  sx={{
                    transition: "all 0.3s ease",
                  }}
                >
                  保存
                </Button>
              </Fade>
              <Fade in={isPromptSaving}>
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: isPromptSaving ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress size={24} color="inherit" />
                </Box>
              </Fade>
              <Fade in={isPromptSaved}>
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: isPromptSaved ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckIcon />
                </Box>
              </Fade>
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
                <MenuItem value={AIModel["gpt-4o-mini"]}>GPT-4o mini</MenuItem>
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
          <CardActions
            sx={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Fade in={!isSettingsSaving && !isSettingsSaved}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!isSettingsSaveEnabled || isSettingsSaving}
                  onClick={handleSettingsSave}
                  sx={{
                    transition: "all 0.3s ease",
                  }}
                >
                  保存
                </Button>
              </Fade>
              <Fade in={isSettingsSaving}>
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: isSettingsSaving ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress size={24} color="inherit" />
                </Box>
              </Fade>
              <Fade in={isSettingsSaved}>
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: isSettingsSaved ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckIcon />
                </Box>
              </Fade>
            </Box>
          </CardActions>
        </Card>
      </Container>
      {/* フローティングボタン */}
      <Fab
        color="primary"
        aria-label="チャット"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => toggleDrawer(true)}
      >
        <ChatIcon />
      </Fab>
      {/* Drawer for テストチャット */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => toggleDrawer(false)}
        transitionDuration={500} // アニメーションの時間を指定
        sx={{
          "& .MuiDrawer-paper": {
            transition: "transform 0.5s ease-in-out", // 開閉時のスムーズなアニメーション
          },
        }}
      >
        <Slide direction="left" in={isDrawerOpen} mountOnEnter unmountOnExit>
          <Box
            sx={{
              width: 450,
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
            role="presentation"
          >
            {/* Header */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              sx={{ borderBottom: "1px solid #ccc", pb: 1 }}
            >
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                テストチャット
              </Typography>
              <IconButton onClick={() => toggleDrawer(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Chat History */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                border: "1px solid #ccc",
                borderRadius: 2,
                padding: 2,
                backgroundColor: "#f9f9f9",
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "#f0f0f0",
                  borderRadius: "10px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "#c0c0c0",
                  borderRadius: "10px",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: "#a0a0a0",
                },
              }}
            >
              <List>
                {chatHistory.map((message, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        alignItems: "flex-start",
                        backgroundColor:
                          message.role === "user" ? "#e3f2fd" : "#f1f8e9",
                        borderRadius: 2,
                        mb: 1,
                        boxShadow: 1,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            backgroundColor:
                              message.role === "user" ? "#2196f3" : "#8bc34a",
                          }}
                        >
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
                            sx={{
                              fontWeight: "bold",
                              color:
                                message.role === "user" ? "#0d47a1" : "#33691e",
                            }}
                          >
                            {message.role === "user" ? "あなた" : "ボット"}
                          </Typography>
                        }
                        secondary={message.content}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
                {isSending && (
                  <ListItem>
                    <CircularProgress size={24} />
                    <ListItemText primary="応答を生成中..." sx={{ ml: 2 }} />
                  </ListItem>
                )}
                <div ref={chatEndRef} />
              </List>
            </Box>

            {/* Message Input Section */}
            <Box display="flex" mt={2} alignItems="stretch">
              <TextField
                label="メッセージを入力"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                fullWidth
                multiline
                rows={2}
                sx={{
                  backgroundColor: "#ffffff",
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendMessage}
                disabled={isSending || !chatMessage.trim()}
                sx={{
                  ml: 2,
                  height: "auto", // ボタンの高さを入力フィールドに合わせる
                  alignSelf: "center",
                  py: 2, // 高さを入力フィールドとマッチさせるためにパディングを使用
                }}
                endIcon={<SendIcon />}
              >
                送信
              </Button>
            </Box>
          </Box>
        </Slide>
      </Drawer>

      {/* プロンプト生成ツールのダイアログ */}
      <Dialog
        open={openGeneratePrompt}
        onClose={handleCloseGeneratePrompt}
        fullWidth
        maxWidth="md"
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.7)", // より濃いバックドロップ
            transition: "opacity 0.5s ease",
          },
        }}
        TransitionComponent={Fade}
        transitionDuration={500}
        PaperProps={{
          sx: {
            borderRadius: 4,
            backgroundColor: "#fafafa",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#2196f3",
            color: "#ffffff",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            padding: "16px 24px",
          }}
        >
          <SmartToyIcon sx={{ mr: 1 }} />
          プロンプト生成ツール
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            backgroundColor: "#ffffff",
            padding: 3,
            boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <PromptGenerator
            onClose={() => setOpenGeneratePrompt(false)}
            onComplete={handleCompleteGeneratePrompt}
            initialPrompt={prompt}
          />
        </DialogContent>
        {/* <DialogActions
          sx={{
            justifyContent: "space-between",
            padding: "16px 24px",
            backgroundColor: "#f0f0f0",
          }}
        >
          <Button
            onClick={handleCloseGeneratePrompt}
            color="secondary"
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{
              borderRadius: 2,
              padding: "8px 16px",
            }}
          >
            閉じる
          </Button>

          <Button
            onClick={() => handleCompleteGeneratePrompt(prompt)}
            color="primary"
            variant="outlined"
            startIcon={<CheckIcon />}
            sx={{
              borderRadius: 2,
              padding: "8px 24px",
            }}
          >
            完了
          </Button>
        </DialogActions> */}
      </Dialog>
    </ThemeProvider>
  );
};

export default EditPromptView;
