// src/components/LoginForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginForm() {
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
      navigate("/board");
    } catch (err) {
      alert("로그인 실패: 이메일 또는 비밀번호를 확인하세요.");
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
        <div className="flex justify-center mb-6"></div>
        <h2 className="text-2xl font-semibold text-center mb-8">로그인</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-1 text-sm">
              Gmail 주소
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#1e293b] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 text-sm">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#1e293b] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 transition text-white font-semibold"
          >
            로그인
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-400">
          {/* 아직 미구현 */}
          <a href="#" className="text-indigo-400 hover:underline">
            비밀번호 찾기
          </a>
          <span className="mx-2 text-gray-500">|</span>
          <a href="/register" className="text-indigo-400 hover:underline">
            회원가입하기
          </a>
        </div>
      </div>
    </div>
  );
}
