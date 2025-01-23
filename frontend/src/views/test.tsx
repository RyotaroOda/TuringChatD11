import React from "react";
import PersonIcon from "@mui/icons-material/Person";
import { Box, Container } from "@mui/material";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";

const TestView: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 8 }}>
      <Box sx={{ justifyContent: "center" }}>
        {/* <PersonIcon sx={{ x: 100, y: 100, scale: 5 }} /> */}
        <PsychologyAltIcon sx={{ x: 200, y: 200, scale: 4 }} />
      </Box>
    </Container>
  );
};
export default TestView;
