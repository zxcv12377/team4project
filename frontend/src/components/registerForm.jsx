import React, { useState } from "react";
import axiosInstance from "../lib/axiosInstance";
import { useNavigate } from "react-router-dom";

function RegisterForm({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    nickname: "",
    password: "",
    token: "",
  });
  const [step, setStep] = useState("input"); // "input" | "code"
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const requestEmailVerification = async () => {
    try {
      await axiosInstance.post("/email/send", {
        email: formData.email,
      });
      alert("인증 코드가 이메일로 전송되었습니다.");
      setStep("code");
    } catch (error) {
      alert(error.response?.data?.message || "인증 요청 실패");
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      await axiosInstance.post("/email/verify", formData);
      alert("회원가입 성공!");
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  /* ✔ 비밀번호 찾기 화면으로 이동 */
  const goToPasswordReset = (e) => {
    e.preventDefault();
    navigate("/passwordreset");
    window.location.reload();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-purple-600 mb-2">회원가입</h2>

      {step === "input" ? (
        <>
          <input
            name="email"
            type="email"
            placeholder="이메일"
            className="w-full px-3 py-2 border rounded text-black"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            name="nickname"
            placeholder="닉네임"
            className="w-full px-3 py-2 border rounded text-black"
            value={formData.nickname}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="비밀번호"
            className="w-full px-3 py-2 border rounded text-black"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button
            onClick={requestEmailVerification}
            className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
          >
            이메일 인증 요청
          </button>
        </>
      ) : (
        <>
          <input
            name="token"
            placeholder="인증 코드"
            className="w-full px-3 py-2 border rounded text-black"
            value={formData.token}
            onChange={handleChange}
            required
          />
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "가입 중..." : "회원가입 완료"}
          </button>
        </>
      )}

      <div className="text-sm text-gray-600 mt-2 items-center">
        {/* 여기서 navigate 사용 */}
        <a href="/passwordreset" onClick={goToPasswordReset} className="hover:underline">
          비밀번호 찾기
        </a>
        <span className="mx-2">|</span>
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            onSwitchToLogin?.();
          }}
          className="hover:underline"
        >
          로그인
        </a>
      </div>
    </div>
  );
}

export default RegisterForm;
