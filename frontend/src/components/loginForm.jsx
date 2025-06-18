import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8080/member/login", {
        email,
        password,
      });

      const token = response.data.token;
      localStorage.setItem("token", token);
      setError("");
      navigate("/board");
    } catch (err) {
      console.error(err);
      setError("로그인 실패: 이메일 또는 비밀번호를 확인하세요.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-purple-900 flex items-center justify-center px-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-purple-400 text-center mb-6">로그인</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-purple-300 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-black/30 border border-purple-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-purple-300 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-black/30 border border-purple-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition"
          >
            로그인
          </button>
        </form>
        <div className="text-center mt-4">
          <button onClick={() => navigate("/register")} className="text-purple-300 hover:underline text-sm">
            회원가입창으로
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
