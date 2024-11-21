//frontend/src/components/ImpressionEdit.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addUserImpression } from "../services/firestore-database_f.ts";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
} from "@mui/material";

const ImpressionEdit: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message) {
      console.log("message", message);
      await addUserImpression(message);
      alert("送信しました。");
      navigate(-1);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          フィードバック
        </Typography>
        <Typography variant="body1" gutterBottom textAlign="center">
          ご意見や感想を教えてください
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box mt={2}>
            <TextField
              label="メッセージ"
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              variant="outlined"
            />
          </Box>
          <Box mt={3} textAlign="center">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ textTransform: "none", fontSize: "1rem" }}
            >
              送信
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ImpressionEdit;
