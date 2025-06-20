import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginForm({ onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8080/member/login", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.token);
      window.location.reload();
      navigate("/board");
    } catch (err) {
      alert("로그인 실패: 이메일 또는 비밀번호를 확인하세요.");
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

      {/* 2. 폼은 고정 너비로 가운데 배치 */}
      <form
        onSubmit={handleSubmit}
        className="absolute left-1/2 top-1/2 z-10 flex flex-col items-center space-y-4 px-6"
        style={{
          width: 400,
          transform: "translate(-50%, -50%)",
        }}
      >
        <h2 className="text-3xl font-bold text-red-500">로그인</h2>
        <input
          id="email"
          type="email"
          placeholder="Gmail"
          className="w-full px-3 py-2 border border-gray-300 rounded text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          id="password"
          type="password"
          placeholder="비밀번호"
          className="w-full px-3 py-2 border border-gray-300 rounded text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-red-400 text-white py-2 rounded hover:bg-red-500">
          로그인
        </button>
        <div className="text-sm text-gray-600  mt-2 flex space-x-2">
          <a href="#" className="hover:underline">
            비밀번호 찾기
          </a>
          <span className="mx-2">|</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToRegister?.();
            }}
            className="hover:underline"
          >
            회원가입
          </a>
        </div>
      </form>
    </div>
  );
}
