import React, { useState } from "react";
import axios from "axios";
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
      await axios.post("http://localhost:8080/email/send", {
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
      await axios.post("http://localhost:8080/email/verify", formData);
      alert("회원가입 성공!");
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto" style={{ width: 1200, height: 800 }}>
      {/* 1. 프레임 이미지 */}
      <img
        src="/strawberry-frame.png"
        alt="strawberry frame"
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
      />

      {/* 2. 폼 중앙 배치 */}
      <div
        className="absolute left-1/2 top-1/2 z-10 flex flex-col space-y-4 items-center px-6"
        style={{
          width: 400,
          transform: "translate(-50%, -50%)",
        }}
      >
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

        <div className="text-sm text-gray-600 mt-2">
          <a href="#" className="hover:underline">
            비밀번호 찾기
          </a>
          <span className="mx-2">|</span>
          <a
            href="#"
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
    </div>
  );
}

export default RegisterForm;
