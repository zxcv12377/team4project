import React, { useState } from "react";
import LoginForm from "./loginForm";
import RegisterForm from "./registerForm";

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setIsLogin(true)} disabled={isLogin}>
          로그인
        </button>
        <button onClick={() => setIsLogin(false)} disabled={!isLogin}>
          회원가입
        </button>
      </div>
      <div style={{ width: "100%", maxWidth: 400 }}>{isLogin ? <LoginForm /> : <RegisterForm />}</div>
    </div>
  );
}

export default AuthPage;
