import React, { useEffect, useState, useRef } from "react";
import PromptGenerator from "./PromptGenerator2.tsx";
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
  Fade,
  SelectChangeEvent,
  CardActions,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { AIModel, BotData, GPTMessage } from "../shared/types.ts";
import { generateTestMessage } from "../API/chatGPT_f.ts";
import ChatIcon from "@mui/icons-material/Chat";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import CheckIcon from "@mui/icons-material/Check";
import { updateUserProfile } from "../API/firestore-database_f.ts";
import { auth } from "../API/firebase_f.ts";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { theme } from "../App.tsx";

const EditPromptView: React.FC = () => {
  const bots: BotData = useLocation().state;
  const navigate = useNavigate();

  // State variables
  const [defaultBotId, setDefaultBotId] = useState<number>(bots.defaultId);
  const [selectedBotId, setSelectedBotId] = useState<number>(
    bots.defaultId || bots.data[0].id
  );
  const [botSettings, setBotSettings] = useState(bots.data);

  // 選択中のBot情報
  const currentBot = botSettings.find((b) => b.id === selectedBotId);
  const [prompt, setPrompt] = useState<string>(currentBot?.prompt ?? "");
  const [botName, setBotName] = useState<string>(currentBot?.name ?? "");
  const [model, setModel] = useState<AIModel>(
    currentBot?.model ?? AIModel["gpt-3.5-turbo"]
  );
  const [creativity, setCreativity] = useState<number>(
    currentBot?.temperature ?? 0.7
  );
  const [certainty, setCertainty] = useState<number>(currentBot?.top_p ?? 0.9);

  const [isPromptSaveEnabled, setIsPromptSaveEnabled] =
    useState<boolean>(false);
  const [isPromptNameSaveEnabled, setIsPromptNameSaveEnabled] =
    useState<boolean>(false);
  const [isSettingsSaveEnabled, setIsSettingsSaveEnabled] =
    useState<boolean>(false);

  const [changeDefault, setChangeDefault] = useState<boolean>(false);

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
        const responseContent = await generateTestMessage(filteredMessages);
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

  // チャット履歴が更新されたときに自動で下にスクロール
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // ドロワーの開閉を制御する処理
  const toggleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
  };
  //#endregion

  //#region プロンプト編集ツール（Dialog）
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

  // 生成ツールにより完成したプロンプトを受け取り
  const handleCompleteGeneratePrompt = (generatedPrompt: string) => {
    setPrompt(generatedPrompt); // 完成したプロンプトを保存
    handlePromptSave(generatedPrompt);
    setOpenGeneratePrompt(false);
  };
  //#endregion

  //#region 保存処理
  const [isPromptSaving, setIsPromptSaving] = useState(false);
  const [isPromptSaved, setIsPromptSaved] = useState(false);
  const [isSettingsSaving, setIsSettingsSaved] = useState(false);
  const [isSettingsSaved, setIsSettingsSavedLocal] = useState(false);
  const [isPromptNameSaving, setIsPromptNameSaving] = useState(false);
  const [isPromptNameSaved, setIsPromptNameSaved] = useState(false);
  // プロンプト保存処理
  const handlePromptSave = async (newPrompt: string) => {
    setIsPromptSaving(true); // ロード中状態
    const updatedBotSettings = botSettings.map((bot) =>
      bot.id === selectedBotId
        ? { ...bot, name: botName, prompt: newPrompt }
        : bot
    );
    setBotSettings(updatedBotSettings);
    await updateUserProfile({
      bots: {
        defaultId: defaultBotId,
        data: updatedBotSettings,
      },
    });
    setIsPromptSaveEnabled(false);
    setIsPromptSaving(false);
    setIsPromptSaved(true);
    setTimeout(() => {
      setIsPromptSaved(false);
    }, 1000);
  };

  // 設定保存処理
  const handleSettingsSave = async () => {
    setIsSettingsSaved(true);
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
    setIsSettingsSaved(false);
    setIsSettingsSavedLocal(true);
    setTimeout(() => {
      setIsSettingsSavedLocal(false);
    }, 1000);
  };

  const handlePromptNameSave = async () => {
    setIsPromptNameSaving(true); // ロード中状態
    const updatedBotSettings = botSettings.map((bot) =>
      bot.id === selectedBotId ? { ...bot, name: botName, prompt: prompt } : bot
    );
    setBotSettings(updatedBotSettings);
    await updateUserProfile({
      bots: {
        defaultId: changeDefault ? selectedBotId : defaultBotId,
        data: updatedBotSettings,
      },
    });
    setIsPromptNameSaveEnabled(false);
    setIsPromptNameSaving(false);
    setIsPromptNameSaved(true);
    setTimeout(() => {
      setIsPromptNameSaved(false);
    }, 1000);
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

  const handleBackSegue = () => {
    if (isPromptSaveEnabled || isSettingsSaveEnabled) {
      const confirmClose = window.confirm(
        "編集内容が保存されていません。閉じてもよろしいですか？"
      );
      if (!confirmClose) return;
    }
    navigate("/");
  };
  //#endregion

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* AppBar */}
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
            onClick={handleBackSegue}
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
            <Box
              display="flex"
              alignItems="center"
              mb={2}
              justifyContent="space-between"
            >
              <Typography variant="h5">
                {" "}
                <SaveIcon color="primary" sx={{ mr: 1 }} />
                プロンプト
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setOpenGeneratePrompt(true)}
                startIcon={<AddIcon />}
              >
                新規作成
              </Button>
            </Box>
            <FormControl fullWidth>
              <InputLabel>プロンプトを選択</InputLabel>
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
              <TextField
                label="プロンプト名 変更"
                value={botName}
                onChange={(e) => {
                  setBotName(e.target.value);
                  setIsPromptNameSaveEnabled(true);
                }}
                fullWidth
                sx={{ mt: 2 }}
              />
            </FormControl>
            {defaultBotId === selectedBotId ? (
              <Box display="flex" sx={{ mt: 2 }}>
                <CheckIcon color="primary" />
                <Typography sx={{ ml: 1 }}>デフォルトに設定中</Typography>
              </Box>
            ) : (
              <FormControlLabel
                sx={{ mt: 2 }}
                control={
                  <Checkbox
                    onChange={(e) => {
                      setChangeDefault(e.target.checked);
                      setIsPromptNameSaveEnabled(true);
                    }}
                  />
                }
                label="デフォルトに設定"
              />
            )}
          </CardContent>
          <CardActions
            sx={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Fade in={!isPromptNameSaving && !isPromptNameSaved}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!isPromptNameSaveEnabled || isPromptNameSaving}
                  onClick={() => handlePromptNameSave()}
                  sx={{
                    transition: "all 0.3s ease",
                  }}
                >
                  保存
                </Button>
              </Fade>
              {/* 保存処理中アニメーション */}
              {isPromptSaving && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  <CircularProgress size={24} color="inherit" />
                </Box>
              )}
              {/* 保存完了アイコン */}
              {isPromptSaved && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "success.main",
                  }}
                >
                  <CheckIcon />
                </Box>
              )}
            </Box>
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
                <EditIcon color="primary" sx={{ mr: 1 }} />
                プロンプト編集
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleOpenGeneratePrompt}
                startIcon={<AutoAwesomeIcon />}
              >
                テンプレート
              </Button>
            </Box>

            <TextField
              label="プロンプト"
              multiline
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
            <Box sx={{ position: "relative" }}>
              <Fade in={!isPromptSaving && !isPromptSaved}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!isPromptSaveEnabled || isPromptSaving}
                  onClick={() => handlePromptSave(prompt)}
                  sx={{
                    transition: "all 0.3s ease",
                  }}
                >
                  保存
                </Button>
              </Fade>
              {/* 保存処理中アニメーション */}
              {isPromptSaving && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  <CircularProgress size={24} color="inherit" />
                </Box>
              )}
              {/* 保存完了アイコン */}
              {isPromptSaved && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "success.main",
                  }}
                >
                  <CheckIcon />
                </Box>
              )}
            </Box>
          </CardActions>
        </Card>

        {/* モデル設定 */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <SettingsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">モデル設定</Typography>
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
                <MenuItem value={AIModel["gpt-3.5-turbo"]}>
                  GPT-3.5-turbo
                </MenuItem>
                <MenuItem value={AIModel["gpt-4"]}>GPT-4</MenuItem>
              </Select>
            </FormControl>
            <Box mt={4}>
              <Typography gutterBottom>Temperature（創造性）</Typography>
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
            <Box mt={4}>
              <Typography gutterBottom>Top_p（確実性）</Typography>
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
                  disabled={!isSettingsSaveEnabled}
                  onClick={handleSettingsSave}
                >
                  保存
                </Button>
              </Fade>
              {/* 保存処理中アニメーション */}
              {isSettingsSaving && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  <CircularProgress size={24} color="inherit" />
                </Box>
              )}
              {/* 保存完了アイコン */}
              {isSettingsSaved && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "success.main",
                  }}
                >
                  <CheckIcon />
                </Box>
              )}
            </Box>
          </CardActions>
        </Card>
      </Container>

      {/* フローティングボタン（テストチャット用） */}
      {!isDrawerOpen && (
        <Fab
          color="primary"
          aria-label="チャット"
          sx={{ position: "fixed", bottom: 16, right: 16 }}
          onClick={() => toggleDrawer(true)}
        >
          <ChatIcon />
        </Fab>
      )}

      {/* Drawer for テストチャット */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => toggleDrawer(false)}
        transitionDuration={500}
        sx={{
          "& .MuiDrawer-paper": {
            transition: "transform 0.5s ease-in-out",
          },
        }}
      >
        <Box
          sx={{
            width: 400,
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

          {/* チャット履歴 */}
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
                          auth.currentUser && auth.currentUser.photoURL ? (
                            <Avatar
                              src={auth.currentUser.photoURL}
                              alt="User Avatar"
                            />
                          ) : (
                            <PersonIcon />
                          )
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

          {/* メッセージ入力 */}
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
                height: "auto",
                alignSelf: "center",
                py: 2,
              }}
              endIcon={<SendIcon />}
            >
              送信
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* プロンプト生成ツールのダイアログ */}
      <Dialog
        open={openGeneratePrompt}
        onClose={handleCloseGeneratePrompt}
        fullWidth
        maxWidth="md"
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
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
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
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
          {/* ここで新しい仕様を反映したPromptGeneratorを呼び出す */}
          <PromptGenerator
            onClose={() => setOpenGeneratePrompt(false)}
            onComplete={handleCompleteGeneratePrompt}
            initialPrompt={prompt}
          />
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

export default EditPromptView;
