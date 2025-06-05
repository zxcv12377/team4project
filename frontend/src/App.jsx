import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./components/authPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/board" element={<div>BOARD (로그인 후 접근)</div>} />
      </Routes>
    </Router>
  );
}

export default App;
