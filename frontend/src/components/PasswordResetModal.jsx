import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Hash, Lock, Loader2, Eye, EyeOff, Clock, ArrowLeft } from "lucide-react";

/**
 * 단일 모달 컴포넌트
 * step: 'email' -> 'code' -> 'reset'
 */
export default function PasswordResetModal({
  defaultEmail = "",
  onDone, // 완료 후 콜백(예: 모달 닫고 로그인 모달 띄우기)
  onCancel, // 취소 버튼
}) {
  const [step, setStep] = useState(defaultEmail ? "code" : "email");
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  const resetAlerts = () => {
    setErrMsg("");
    setOkMsg("");
  };

  // 1) 인증 코드 보내기
  const sendCode = async () => {
    resetAlerts();
    if (!email) return setErrMsg("이메일을 입력해주세요.");
    try {
      setLoading(true);
      await axiosInstance.post("/passwordreset/email", { email });
      setOkMsg("인증 코드가 이메일로 전송되었습니다.");
      setStep("code");
      setCooldown(60);
    } catch (e) {
      setErrMsg(e?.response?.data?.message || "인증 코드 전송 실패");
    } finally {
      setLoading(false);
    }
  };

  // 2) 코드 검증
  const verifyCode = async () => {
    resetAlerts();
    if (!email) return setErrMsg("이메일 정보가 없습니다.");
    if (!code) return setErrMsg("인증 코드를 입력해주세요.");
    try {
      setLoading(true);
      await axiosInstance.post("/passwordreset/verify", { email, code });
      setOkMsg("인증이 완료되었습니다. 새 비밀번호를 설정해주세요.");
      setStep("reset");
    } catch (e) {
      setErrMsg(e?.response?.data?.message || "인증 실패");
    } finally {
      setLoading(false);
    }
  };

  // 3) 비밀번호 변경
  const changePassword = async () => {
    resetAlerts();
    if (!email) return setErrMsg("이메일 정보가 없습니다. 처음부터 다시 진행해주세요.");
    if (pw1.length < 4) return setErrMsg("비밀번호는 4자 이상이어야 합니다.");
    if (pw1 !== pw2) return setErrMsg("비밀번호가 일치하지 않습니다.");

    try {
      setLoading(true);

      // 서버 호환: newPassword / password 둘 다 전송
      const payload = { email, newPassword: pw1, password: pw1, code };

      await axiosInstance.post("/passwordreset/confirm", payload);
      setOkMsg("비밀번호가 변경되었습니다. 다시 로그인해 주세요.");
      setTimeout(() => onDone?.(), 800);
    } catch (e) {
      setErrMsg(e?.response?.data?.message || "비밀번호 변경 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-[396px] max-w-[92vw] min-h-[450px] rounded-2xl shadow-lg border-pink-200 bg-white flex flex-col">
      <CardHeader className="pt-8 pb-2">
        <h2 className="text-2xl font-bold">비밀번호 찾기</h2>
        <p className="text-sm text-gray-500 mt-1">
          {step === "email" && "이메일로 인증 코드를 보내드립니다."}
          {step === "code" && "이메일로 받은 인증 코드를 입력해주세요."}
          {step === "reset" && "새 비밀번호를 설정하세요 (8자 이상)."}
        </p>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 flex-1 min-h-[260px]">
        {errMsg && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errMsg}</div>
        )}
        {okMsg && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {okMsg}
          </div>
        )}

        {/* Step 1: 이메일 입력 */}
        {step === "email" && (
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
                className="pl-10"
                autoComplete="email"
              />
            </div>
          </div>
        )}

        {/* Step 2: 코드 입력 */}
        {step === "code" && (
          <>
            {/* 이메일 보기 + 수정 가기 */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                대상 이메일: <span className="font-medium">{email || "-"}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setOkMsg("");
                }}
                className="gap-1"
              >
                <ArrowLeft className="size-4" /> 수정
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code">인증 코드</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-60" />
                <Input
                  id="code"
                  placeholder="이메일로 받은 6자리 코드"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="pl-10"
                  inputMode="numeric"
                />
              </div>
              <div className="text-xs text-gray-500">
                메일이 안 왔다면 스팸함 확인 또는{" "}
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={loading || cooldown > 0 || !email}
                  className="text-rose-600 hover:underline disabled:opacity-50"
                >
                  {cooldown > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {cooldown}초 후 재전송
                    </span>
                  ) : (
                    "코드 재전송"
                  )}
                </button>
                을 눌러주세요.
              </div>
            </div>
          </>
        )}

        {/* Step 3: 새 비밀번호 */}
        {step === "reset" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="pw1">새 비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-60" />
                <Input
                  id="pw1"
                  type={show1 ? "text" : "password"}
                  placeholder="•••• (4자 이상)"
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  className="pl-10 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShow1((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100 transition"
                  aria-label={show1 ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {show1 ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pw2">비밀번호 확인</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-60" />
                <Input
                  id="pw2"
                  type={show2 ? "text" : "password"}
                  placeholder="••••••••"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="pl-10 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShow2((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100 transition"
                  aria-label={show2 ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {show2 ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="pb-6 pt-2 flex gap-2">
        {/* 왼쪽: 취소/이전 */}
        {step === "email" ? (
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            취소
          </Button>
        ) : (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              if (step === "code") setStep("email");
              if (step === "reset") setStep("code");
              setOkMsg("");
              setErrMsg("");
            }}
          >
            <ArrowLeft className="size-4 mr-1" /> 이전
          </Button>
        )}

        {/* 오른쪽: 다음 액션 */}
        {step === "email" && (
          <Button
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
            onClick={sendCode}
            disabled={loading || !email}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                전송 중…
              </span>
            ) : (
              "인증 코드 전송"
            )}
          </Button>
        )}
        {step === "code" && (
          <Button
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
            onClick={verifyCode}
            disabled={loading || !code}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                확인 중…
              </span>
            ) : (
              "인증 확인"
            )}
          </Button>
        )}
        {step === "reset" && (
          <Button
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
            onClick={changePassword}
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                변경 중…
              </span>
            ) : (
              "비밀번호 변경"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
