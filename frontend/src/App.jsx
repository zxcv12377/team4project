import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./components/authPage";
import BoardPage from "./components/board";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/member/login" element={<AuthPage />} />
        <Route path="/board" element={<BoardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
