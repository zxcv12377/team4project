import React, { useEffect, useState } from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MyProfile from "./components/myProfile";
import LoginForm from "./components/loginForm";

import RegisterForm from "./components/registerForm";
import ProtectedRoute from "./components/protectedRoute";
import { BoardList } from "./components/Board";
import Navbar from "./components/navbar";
import UpdateMyProfile from "./components/UpdateMyProfile";
import ReplyList from "./components/replyList";
import axiosInstance from "./lib/axiosInstance";
import { useWebSocket } from "./hooks/useWebSocket";
import ChattingModule from "./components/ChattingModule";

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const ws = useWebSocket(token); // ✅ 단일 생성
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUserRaw = localStorage.getItem("user");

    if (savedToken && savedUserRaw) {
      try {
        const parsedUser = JSON.parse(savedUserRaw);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (err) {
        console.error("❌ Failed to parse savedUser:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (token) => {
    try {
      localStorage.setItem("token", token);
      setToken(token);

      const res = await axiosInstance.get("/members/me");
      const full = { ...res.data, token };
      localStorage.setItem("user", JSON.stringify(full));
      setUser(full);

      window.location.href = "/";
    } catch (e) {
      console.error("로그인 처리 중 오류", e);
    }
  };

  const handleLogout = () => {
    ws.disconnect(); // ✅ 위에서 생성한 ws 활용
    localStorage.clear();
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  if (isLoading) return <div>Loading...</div>;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        <Route element={<Navbar />}>
          <Route path="/" element={<Navigate to="/board" />} />
          <Route path="/boardList" element={<boardList />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/reply" element={<ReplyList />} />
          <Route path="/UpdateProfile" element={<UpdateMyProfile />} />
          <Route path="/chatting" element={<ChattingModule />} />
          {/* 보호된 라우트(로그인 인증 후 접근 가능한 경로 지정) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
