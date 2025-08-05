import { useEffect, useState } from "react";
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

import BoardList from "./components/boardList";
import BoardCreate from "./components/boardCreate";
import BoardDetail from "./components/boardDetail";
import BoardModify from "./components/boardModify";
import ForgotPasswordPage from "./components/forgotPasswordPage";
import ResetPasswordPage from "./components/resetPasswordPage";
import MyBoard from "./components/myBoard";
import MyReply from "./components/myReply";
import MainPage from "./components/mainPage";
import MemberMaintenance from "./components/admin/memberMaintenance";
import AdminPage from "./components/admin/adminPage";
import BoardChannelList from "./components/boardChannelList";
import CreateBoardChannel from "./components/admin/createBoardChannel";
import BoardSearch from "./components/boardSearch";

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
    window.location.href = "/";
  };

  if (isLoading) return <div>Loading...</div>;
  return (
    <WebSocketContext.Provider value={ws}>
      <UserProvider>
        <ChatProvider>
          <ThemeProvider>
            <RealtimeProvider socket={ws}>
              <BrowserRouter>
                <Routes>
                  <Route path="/chatting/*" element={<ChattingModule />}>
                    <Route index element={<Layout />} />
                  </Route>
                  <Route path="/" element={<Navigate to="/MainPage" replace />} />
                  <Route element={<Navbar />}>
                    <Route path="/MainPage" element={<MainPage />} />
                    <Route path="/boardChannels" element={<BoardChannelList />}></Route>

                    <Route path="/reply" element={<ReplyList />} />
                    <Route path="/UpdateProfile" element={<UpdateMyProfile />} />
                    <Route path="/channels/:channelId" element={<BoardList />} />
                    <Route path="/channels/:channelId/create" element={<BoardCreate />} />
                    <Route path="/channels/:channelId/:bno" element={<BoardDetail />} />
                    <Route path="/channels/:channelId/update/:bno" element={<BoardModify />} />
                    <Route path="/profile" element={<MyProfile />} />
                    <Route path="/myboard" element={<MyBoard />} />
                    <Route path="/myreply" element={<MyReply />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/admin/members" element={<MemberMaintenance />} />
                    <Route path="/admin/boardChannels/create" element={<CreateBoardChannel />} />
                    <Route path="/boards/search" element={<BoardSearch />} />
                  </Route>
                  <Route path="/passwordreset" element={<ForgotPasswordPage />} />
                  <Route path="/passwordreset/confirm" element={<ResetPasswordPage />} />
                </Routes>
              </BrowserRouter>
            </RealtimeProvider>
          </ThemeProvider>
        </ChatProvider>
      </UserProvider>
    </WebSocketContext.Provider>
  );
}
export default App;
