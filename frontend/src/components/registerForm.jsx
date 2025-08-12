// src/components/RegisterForm.jsx
import React, { useState } from "react";
import axiosInstance from "../lib/axiosInstance";
import { useNavigate } from "react-router-dom";

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, Lock, Hash, Eye, EyeOff, Loader2, Send } from "lucide-react";

function RegisterForm({ onSwitchToLogin, onSwitchToReset }) {
  const [formData, setFormData] = useState({
    email: "",
    nickname: "",
    password: "",
    token: "",
  });
  const [step, setStep] = useState("input"); // "input" | "code"
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [showPw, setShowPw] = useState(false);

  const navigate = useNavigate();

  // 로그인폼과 동일한 규격(DevTools 값 기준)
  const AUTH_CARD_CLASS =
    "w-[396px] max-w-[92vw] min-h-[450px] rounded-2xl shadow-lg border-pink-200 bg-white flex flex-col";
  const CONTENT_MINH = "min-h-[260px]"; // 내부 폼 높이 확보(단계 전환 시 깜빡임 방지)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const requestEmailVerification = async () => {
    setErrMsg("");
    setOkMsg("");
    if (!formData.email) {
      setErrMsg("이메일을 입력해주세요.");
      return;
    }
    try {
      setLoading(true);
      await axiosInstance.post("/email/send", { email: formData.email });
      setOkMsg("인증 코드가 이메일로 전송되었습니다.");
      setStep("code");
    } catch (error) {
      setErrMsg(error.response?.data?.message || "인증 요청 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrMsg("");
    setOkMsg("");
    if (!formData.token) {
      setErrMsg("인증 코드를 입력해주세요.");
      return;
    }
    try {
      setLoading(true);
      await axiosInstance.post("/email/verify", formData);
      setOkMsg("회원가입이 완료되었습니다. 로그인해주세요!");
      if (onSwitchToLogin) onSwitchToLogin();
      else navigate("/login");
    } catch (error) {
      setErrMsg(error.response?.data?.message || "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  const goToPasswordReset = (e) => {
    e.preventDefault();
    onSwitchToReset?.(formData.email);
  };

  return (
    <Card className={AUTH_CARD_CLASS}>
      <CardHeader className="pt-8 pb-2 flex items-center gap-3">
        <img src="/STRONGBERRY1.png" alt="logo" className="w-10 h-10 object-contain" />
        <h1 className="text-2xl font-bold tracking-tight">
          STRONGBERRY <span className="text-rose-500">회원가입</span>
        </h1>
      </CardHeader>

      <CardContent className={`pt-4 space-y-4 flex-1 ${CONTENT_MINH}`}>
        {errMsg && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errMsg}</div>
        )}
        {okMsg && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {okMsg}
          </div>
        )}

        {step === "input" ? (
          <div className="space-y-4">
            {/* 이메일 */}
            <div className="space-y-1.5">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-60" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* 닉네임 */}
            <div className="space-y-1.5">
              <Label htmlFor="nickname">닉네임</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-60" />
                <Input
                  id="nickname"
                  name="nickname"
                  placeholder="닉네임"
                  value={formData.nickname}
                  onChange={handleChange}
                  required
                  className="pl-10"
                  autoComplete="nickname"
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
                  name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pl-10 pr-10"
                  autoComplete="new-password"
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

            {/* 이메일 인증 요청 */}
            <Button
              onClick={requestEmailVerification}
              disabled={loading || !formData.email}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  요청 중…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Send className="size-4" />
                  이메일 인증 요청
                </span>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 인증 코드 */}
            <div className="space-y-1.5">
              <Label htmlFor="token">인증 코드</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-60" />
                <Input
                  id="token"
                  name="token"
                  placeholder="인증 코드 6자리"
                  value={formData.token}
                  onChange={handleChange}
                  required
                  className="pl-10"
                  inputMode="numeric"
                />
              </div>
              <div className="text-xs text-gray-500">
                메일이 오지 않았다면 스팸함 확인 또는{" "}
                <button
                  type="button"
                  onClick={requestEmailVerification}
                  disabled={loading}
                  className="text-rose-600 hover:underline disabled:opacity-50"
                >
                  코드 재전송
                </button>
                을 눌러주세요.
              </div>
            </div>

            {/* 최종 가입 버튼 */}
            <Button
              onClick={handleRegister}
              disabled={loading || !formData.token}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  가입 중…
                </span>
              ) : (
                "회원가입 완료"
              )}
            </Button>
          </div>
        )}

        {/* 보조 링크 */}
        <div className="mt-2 flex items-center justify-between text-sm">
          <button type="button" onClick={goToPasswordReset} className="text-rose-600 hover:underline">
            비밀번호 찾기
          </button>
          <button type="button" className="text-gray-600 hover:underline" onClick={() => onSwitchToLogin?.()}>
            로그인
          </button>
        </div>
      </CardContent>

      <CardFooter className="pb-6 pt-2">
        <p className="text-xs text-gray-500">이메일 인증 후에만 회원가입이 완료됩니다.</p>
      </CardFooter>
    </Card>
  );
}

export default RegisterForm;
