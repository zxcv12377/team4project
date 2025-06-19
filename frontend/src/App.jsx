import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BoardPage from "./components/board";
import MyProfile from "./components/myProfile";
import ReplyList from "./components/replyList";
import LoginForm from "./components/loginForm";

import RegisterForm from "./components/registerForm";
import ProtectedRoute from "./components/protectedRoute";
import Navbar from "./components/navbar";
import UpdateMyProfile from "./components/UpdateMyProfile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        <Route element={<Navbar />}>
          <Route path="/" element={<Navigate to="/board" />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/reply" element={<ReplyList />} />
          <Route path="UpdateProfile" element={<UpdateMyProfile />} />
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
