import React, { useState } from "react";
import LoginForm from "./loginForm";
import RegisterForm from "./registerForm";

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh", // 전체 높이 확보
    }}
  ></div>;

  return (
    <div style={{ width: "100%", maxWidth: "500px ", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <button onClick={() => setIsLogin(true)} disabled={isLogin}>
          로그인
        </button>
        <button onClick={() => setIsLogin(false)} disabled={!isLogin}>
          회원가입
        </button>
      </div>
      {isLogin ? <LoginForm /> : <RegisterForm />}
    </div>
  );
}

export default AuthPage;
