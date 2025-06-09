import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./components/authPage";
import BoardPage from "./components/board";
import MyProfile from "./components/myProfile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/board" replace />} />
        <Route path="/member/login" element={<AuthPage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/profile" element={<MyProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
