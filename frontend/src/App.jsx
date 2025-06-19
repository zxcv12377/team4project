import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MyProfile from "./components/myProfile";
import ReplyList from "./components/replyList";
import LoginForm from "./components/loginForm";

import RegisterForm from "./components/registerForm";
import ProtectedRoute from "./components/protectedRoute";
<<<<<<< HEAD
import Navbar from "./components/navbar";
import UpdateMyProfile from "./components/UpdateMyProfile";
=======
import { BoardList } from "./components/Board";
>>>>>>> b4e4d5ea99d8d75b248601aa82387517712344a4

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        <Route element={<Navbar />}>
          <Route path="/" element={<Navigate to="/board" />} />
<<<<<<< HEAD
          <Route path="/board" element={<BoardPage />} />
          <Route path="/reply" element={<ReplyList />} />
          <Route path="UpdateProfile" element={<UpdateMyProfile />} />
=======
          <Route path="/board" element={<BoardList />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          {/* 보호된 라우트(로그인 인증 후 접근 가능한 경로 지정) */}
>>>>>>> b4e4d5ea99d8d75b248601aa82387517712344a4
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
