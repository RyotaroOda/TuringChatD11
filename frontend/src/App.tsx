import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomeView from "./views/HomeView.tsx";
import BattleView from "./views/BattleView.tsx";
import ResultView from "./views/ResultView.tsx";

function App() {
  return(
    <Router>
      <Routes>
        <Route path="/battle/:roomId" element={<BattleView />} />
        <Route path="/result" element={<ResultView />} />
        <Route path="/" element={<HomeView />} />
      </Routes>
    </Router>
  );
}

export default App;
