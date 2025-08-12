// src/components/loginForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import axiosInstance from "../lib/axiosInstance";

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

export default function LoginForm({ onSwitchToRegister, onSwitchToReset }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUserContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);
    try {
      const res = await axiosInstance.post("/members/login", { email, password });
      const { token } = res.data;
      localStorage.setItem("token", token);

      const meRes = await axiosInstance.get("/members/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(meRes.data);
      navigate("/");
    } catch (err) {
      console.error(err);
      setErrMsg("이메일 또는 비밀번호를 다시 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const goToPasswordReset = (e) => {
    e.preventDefault();
    onSwitchToReset?.(email);
  };

  return (
    <Card className="w-full max-w-md rounded-2xl shadow-lg border-pink-200 bg-white">
      <CardHeader className="pt-8 pb-2 flex items-center gap-3">
        <img src="/STRONGBERRY1.png" alt="logo" className="w-10 h-10 object-contain" />
        <h1 className="text-2xl font-bold tracking-tight">
          STRONGBERRY <span className="text-rose-500">로그인</span>
        </h1>
      </CardHeader>

      <CardContent className="pt-4">
        {errMsg && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 */}
          <div className="space-y-1.5">
            <Label htmlFor="email">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-60" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
                autoComplete="email"
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-60" />
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100 transition"
                aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* 로그인 버튼 */}
          <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white" disabled={loading}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                로그인 중…
              </span>
            ) : (
              "로그인"
            )}
          </Button>
        </form>

        {/* 보조 링크 */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <button type="button" onClick={goToPasswordReset} className="text-rose-600 hover:underline">
            비밀번호 찾기
          </button>
          <button type="button" className="text-gray-600 hover:underline" onClick={onSwitchToRegister}>
            회원가입
          </button>
        </div>
      </CardContent>

      <CardFooter className="pb-6 pt-2">
        <p className="text-xs text-gray-500">로그인 시 서비스 약관 및 개인정보 처리방침에 동의하게 됩니다.</p>
      </CardFooter>
    </Card>
  );
}
