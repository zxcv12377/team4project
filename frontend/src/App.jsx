import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MyProfile from "./components/myProfile";

import ProtectedRoute from "./components/protectedRoute";
import { BoardList } from "./components/Board";
import Navbar from "./components/navbar";
import ReplyList from "./components/replyList";
import UpdateMyProfile from "./components/updateMyProfile";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Navbar />}>
          <Route path="/" element={<Navigate to="/board" />} />
          <Route path="/boardList" element={<boardList />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/reply" element={<ReplyList />} />
          <Route path="/UpdateProfile" element={<UpdateMyProfile />} />
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
    </Router>
  );
}
export default App;
