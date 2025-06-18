import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function RegisterForm() {
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
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="absolute top-6 left-6">
        <a
          href="/board"
          className="text-white text-2xl font-extrabold tracking-wide hover:text-indigo-400 transition-colors"
        >
          STRONGBERRY
        </a>
      </div>
      <div className="bg-[#0f172a] p-10 rounded-xl w-full max-w-sm text-white">
        <h2 className="text-2xl font-semibold text-center mb-8">회원가입</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm mb-1">이메일</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#1e293b] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="example@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">닉네임</label>
            <input
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#1e293b] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="닉네임"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">비밀번호</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#1e293b] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="비밀번호"
              required
            />
          </div>

          {step === "code" && (
            <div>
              <label className="block text-sm mb-1">인증 코드</label>
              <input
                name="token"
                value={formData.token}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1e293b] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="인증 코드"
              />
            </div>
          )}

          <button
            onClick={step === "input" ? requestEmailVerification : handleRegister}
            disabled={loading}
            className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 transition rounded-md font-semibold"
          >
            {loading ? "처리 중..." : step === "input" ? "이메일 인증 요청" : "회원가입"}
          </button>
        </div>
        <div className="mt-6 text-center text-sm text-gray-400">
          {/* 아직 미구현 */}
          <a href="#" className="text-indigo-400 hover:underline">
            비밀번호 찾기
          </a>
          <span className="mx-2 text-gray-500">|</span>
          <a href="/login" className="text-indigo-400 hover:underline">
            로그인하기
          </a>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
