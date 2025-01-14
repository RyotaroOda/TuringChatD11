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
} from "@mui/material";
import { QuestionnaireData } from "../shared/types.ts";
import SendIcon from "@mui/icons-material/Send";
import { updateUserProfile } from "../API/firestore-database_f.ts";
import { Timestamp } from "firebase/firestore";

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
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ textAlign: "center", mb: 3 }}
      >
        アンケートフォーム
      </Typography>

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
                    ["fun", "difficulty", "experience", "understood", "reuse"][
                      index
                    ]
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
  );
};

export default QuestionnaireEdit;
