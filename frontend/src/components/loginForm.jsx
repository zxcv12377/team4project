// src/components/loginForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import axiosInstance from "../lib/axiosInstance";
import styles from "../styles/login-modal.module.scss";

export default function LoginForm({ onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser, setToken, onLoginSuccess } = useUserContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/members/login", { email, password });
      const { token, refreshToken } = res.data;
     onLoginSuccess({ token, refreshToken });
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("로그인에 실패했습니다.");
    }
  };

  const goToPasswordReset = (e) => {
    e.preventDefault();
    navigate("/passwordreset");
  };

  return (
    <div className={`${styles["form-panel"]} ${styles.one}`}>
      {/* 폼 콘텐츠 */}
      <form onSubmit={handleSubmit} className={styles["form-content"]}>
        {/* 이메일 */}
        <div className={styles["form-group"]}>
          <label>이메일</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* 비밀번호 */}
        <div className={styles["form-group"]}>
          <label>PASSWORD</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* 로그인 버튼 */}
        <div className={styles["form-group"]}>
          <button type="submit">LOG IN</button>
        </div>

        {/* 회원가입 전환 링크 */}
        <div className={styles["form-footer"]}>
          <p className="text-center">
            <button type="button" onClick={goToPasswordReset} className="">
              비밀번호 찾기
            </button>
            <span className="mx-2">|</span>
            <button type="button" className="" onClick={onSwitchToRegister}>
              회원가입
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
