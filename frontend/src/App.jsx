import { useEffect, useState } from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MyProfile from "./components/myProfile";

import Navbar from "./components/navbar";
import UpdateMyProfile from "./components/updateMyProfile";
import ReplyList from "./components/replyList";
import axiosInstance from "./lib/axiosInstance";
import { useWebSocket } from "./hooks/useWebSocket";
import ChattingModule from "./components/ChattingModule";
import { UserContext, UserProvider } from "./context/UserContext";
import { WebSocketContext } from "./context/WebSocketContext";
import { ChatProvider } from "./context/ChatContext";
import { ThemeProvider } from "./context/ThemeContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import Layout from "./layoutscopy/Layout";
import LoginForm from "./components/loginForm";
import RegisterForm from "./components/registerForm";
import LoginPage from "./pages/LoginPage";
import PostDetailPage from "./pages/PostDetailPage";
import PostListPage from "./pages/PostListPage";
import PostFormPage from "./pages/PostFormPage";

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

      const res = await axiosInstance.get("members/me");
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
    window.location.href = "/boards";
  };

  if (isLoading) return <div>Loading...</div>;
  return (
    <WebSocketContext.Provider value={ws}>
      <ChatProvider>
        <ThemeProvider>
          <UserProvider>
            <RealtimeProvider socket={ws}>
              <BrowserRouter>
                <Routes>
                  <Route path="/chatting/*" element={<ChattingModule />}>
                    <Route index element={<Layout />} />
                  </Route>
                  <Route path="/" element={<Navigate to="/boards" replace />} />
                  <Route element={<Navbar />}>
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegisterForm />} />
                    <Route path="/reply" element={<ReplyList />} />
                    <Route path="/UpdateProfile" element={<UpdateMyProfile />} />
                    <Route path="/chatting/*" element={<ChattingModule />} />
                    <Route path="/boards" element={<BoardList />} />
                    <Route path="/board/:bno" element={<BoardDetail />} />
                    <Route path="/board/create" element={<BoardCreate />} />
                    <Route path="/profile" element={<MyProfile />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </RealtimeProvider>
          </UserProvider>
        </ThemeProvider>
      </ChatProvider>
    </WebSocketContext.Provider>
  );
}
export default App;
