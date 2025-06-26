import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axiosInstance";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", // 아이디
    username: "", // 이메일
    password: "",
    code: "",
  });

  const [error, setError] = useState(null);
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [isAvailable, setIsAvailable] = useState(null); // 아이디 중복 확인 상태
  const [message, setMessage] = useState("");

  // 폼 변경
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (e.target.name === "name") {
      setIsAvailable(null); // 아이디 바꾸면 중복 상태 초기화
      setMessage("");
    }
  };

  // 아이디 중복 확인
  const checkName = async () => {
    if (!form.name) return;
    try {
      const res = await axiosInstance.get("/api/members/check-nickname", {
        params: { nickname: form.name },
      });

      if (res.data === true) {
        setIsAvailable(false);
        setMessage("이미 사용 중인 아이디입니다.");
      } else {
        setIsAvailable(true);
        setMessage("사용 가능한 아이디입니다.");
      }
    } catch (e) {
      console.log(e);
      setIsAvailable(null);
      setMessage("중복 확인 실패");
    }
  };

  // 이메일 인증코드 발송
  const handleSendCode = async () => {
    try {
      const res = await axiosInstance.post("/auth/email/send", {
        username: form.username,
      });
      alert("인증코드가 전송되었습니다.");
      setCodeSent(true);
      setVerified(false);
      setExpiryDate(res.data.expiryDate);
    } catch (err) {
      alert("코드 전송 실패: " + (err.response?.data?.error || "에러"));
    }
  };

  // 이메일 인증코드 검증
  const handleVerifyCode = async () => {
    try {
      await axiosInstance.post("/auth/email/verify", {
        username: form.username,
        code: form.code,
      });
      alert("인증 성공");
      setVerified(true);
    } catch (err) {
      alert("인증 실패: " + (err.response?.data?.error || "에러"));
    }
  };

  // 회원가입 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!verified) {
      alert("이메일 인증을 완료해주세요.");
      return;
    }

    if (!isAvailable) {
      alert("아이디 중복 확인을 완료해주세요.");
      return;
    }

    try {
      await axiosInstance.post("/api/members/register", {
        name: form.name,
        username: form.username,
        password: form.password,
      });
      alert("회원가입 완료!");
      navigate("/login");
    } catch (err) {
      const message = err.response?.data?.error || "회원가입 실패";
      setError(message);
    }
  };

  useEffect(() => {
    if (!expiryDate) return;

    const end = new Date(expiryDate).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setCodeSent(false); // 인증 입력창 숨기기
        alert("⏰ 인증 시간이 만료되었습니다. 다시 요청해주세요.");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiryDate]);

  // RegisterPage.jsx
  return (
    <div
      className="min-h-screen pt-32 px-4 flex items-start justify-center 
                  bg-white dark:bg-[#18181b] text-black dark:text-white transition-colors"
    >
      <Card
        className="w-[520px] rounded-2xl shadow-xl py-12 px-10 flex flex-col justify-center 
                    border border-zinc-200 bg-white dark:bg-[#18181b] text-black dark:text-white transition-colors"
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold text-center mb-1 text-gray-900 dark:text-white">회원가입</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* 아이디 */}
            <div>
              <Label htmlFor="name" className="text-base mb-2 block">
                아이디
              </Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="h-12 text-lg flex-1 
                placeholder:text-gray-400 dark:placeholder:text-gray-500 
                bg-white dark:bg-[#18181b] 
                text-black dark:text-white transition-colors"
                  placeholder="아이디를 입력하세요"
                />
                <Button type="button" onClick={checkName} className="h-12 px-5 text-base" variant="outline">
                  중복 확인
                </Button>
              </div>
              {message && (
                <p className={`text-sm mt-1 ${isAvailable ? "text-green-600" : "text-red-600"}`}>{message}</p>
              )}
            </div>
            {/* 이메일 */}
            <div>
              <Label htmlFor="username" className="text-base mb-2 block">
                이메일
              </Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  name="username"
                  type="email"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="h-12 text-lg flex-1 
                placeholder:text-gray-400 dark:placeholder:text-gray-500 
                bg-white dark:bg-[#18181b] 
                text-black dark:text-white transition-colors"
                  placeholder="아이디/비밀번호 찾기 용"
                />
                <Button
                  type="button"
                  onClick={handleSendCode}
                  className="h-12 px-5 text-base"
                  variant="outline"
                  disabled={!form.username}
                >
                  인증코드 발송
                </Button>
              </div>
            </div>
            {/* 인증코드 */}
            {codeSent && (
              <div>
                {!verified && (
                  <Label htmlFor="code" className="text-base mb-1 block">
                    인증코드
                  </Label>
                )}
                {verified ? (
                  <div className="text-green-600 text-base font-semibold mt-1">인증이 완료되었습니다.</div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        id="code"
                        name="code"
                        value={form.code}
                        onChange={handleChange}
                        required
                        className="h-12 text-lg flex-1 bg-white dark:bg-[#18181b] text-black dark:text-white transition-colors"
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        className="h-12 px-6 text-base"
                        variant="secondary"
                      >
                        확인
                      </Button>
                    </div>
                    {secondsLeft !== null && (
                      <span className="text-sm text-gray-500 mt-1 block">
                        남은 시간: {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
            {/* 비밀번호 */}
            <div>
              <Label htmlFor="password" className="text-base mb-2 block">
                비밀번호
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className="h-12 text-lg placeholder:text-gray-400 dark:placeholder:text-gray-500 
              bg-white dark:bg-[#18181b] text-black dark:text-white transition-colors"
                placeholder="비밀번호를 입력하세요"
              />
            </div>
            {error && <p className="text-red-500 text-base">{error}</p>}
            <Button type="submit" className="w-full h-14 text-lg mt-2 rounded-xl">
              가입하기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
