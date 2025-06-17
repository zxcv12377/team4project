import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import BoardPage from "./components/board";
import MyProfile from "./components/myProfile";
import ReplyList from "./components/replyList";
import LoginForm from "./components/loginForm";
import Layoutex from "./components/layoutex";
import RegisterForm from "./components/registerForm";
import ProtectedRoute from "./components/protectedRoute";

function App() {
  return (
    <Router>
      <Layoutex>
        <Routes>
          <Route path="/" element={<Navigate to="/board" />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          {/* 보호된 라우트(로그인 인증 후 접근 가능한 경로 지정) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/reply" element={<ReplyList />} />
        </Routes>
      </Layoutex>
    </Router>
  );
}
export default App;
