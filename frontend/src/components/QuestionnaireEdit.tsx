import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Paper,
  AppBar,
  Toolbar,
} from "@mui/material";
import { QuestionnaireData } from "../shared/types.ts";
import SendIcon from "@mui/icons-material/Send";
import { updateUserProfile } from "../API/firestore-database_f.ts";
import { Timestamp } from "firebase/firestore";
import { ThemeProvider } from "@emotion/react";
import { theme } from "../App.tsx";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const QuestionnaireEdit: React.FC = () => {
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({
    fun: "",
    difficulty: "",
    experience: "",
    understood: "",
    reuse: "",
    message: "",
    timestamp: Timestamp.now(),
  });
  const [message, setMessage] = useState<string>(questionnaire?.message || "");
  const navigate = useNavigate();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setQuestionnaire((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields = [
      "fun",
      "difficulty",
      "experience",
      "understood",
      "reuse",
    ];
    const missingFields = requiredFields.filter(
      (field) => !questionnaire || !questionnaire[field]
    );

    if (missingFields.length > 0) {
      alert("すべての質問に回答してください。");
      return;
    }
    if (questionnaire) {
      console.log("questionnaire", questionnaire);
      console.log("message", message);
      const data = { questionnaire: questionnaire };
      updateUserProfile(data);
      alert("アンケートを送信しました。");
      navigate(-1);
    }
  };

  const options = [
    { value: "1", label: "全くそう思わない" },
    { value: "2", label: "" },
    { value: "3", label: "どちらとも言えない" },
    { value: "4", label: "" },
    { value: "5", label: "とてもそう思う" },
  ];

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
            アンケートフォーム
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {[
              "楽しかったか",
              "むずかしかったか",
              "生成AIを使った経験があるか",
              "生成AIの使い方が理解できたか",
              "また生成AIを使いたいと思ったか",
            ].map((question, index) => (
              <Paper key={index} elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel
                    component="legend"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    {index + 1}. {question}
                  </FormLabel>
                  <RadioGroup
                    name={
                      [
                        "fun",
                        "difficulty",
                        "experience",
                        "understood",
                        "reuse",
                      ][index]
                    }
                    value={
                      questionnaire?.[
                        [
                          "fun",
                          "difficulty",
                          "experience",
                          "understood",
                          "reuse",
                        ][index]
                      ] || ""
                    }
                    onChange={handleChange}
                    row
                  >
                    {options.map((opt) => (
                      <FormControlLabel
                        key={opt.value}
                        value={opt.value}
                        control={<Radio />}
                        label={opt.label}
                        labelPlacement="top"
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Paper>
            ))}

            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <TextField
                label="コメント"
                name="message"
                multiline
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                variant="outlined"
                fullWidth
              />
            </Paper>

            <Box textAlign="center">
              <Button
                variant="contained"
                color="primary"
                type="submit"
                startIcon={<SendIcon />}
                sx={{ minWidth: 200, borderRadius: 2 }}
              >
                送信
              </Button>
            </Box>
          </Stack>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default QuestionnaireEdit;
