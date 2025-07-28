import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axiosInstance from "../lib/axiosInstance";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const sendCode = async () => {
    await axiosInstance.post("/passwordreset/email", { email });
    setCodeSent(true);
  };

  const verifyCode = async () => {
    await axiosInstance.post("/passwordreset/verify", { email, code });
    navigate("/passwordreset/confirm", { state: { email } });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center gap-6">
        <Link to="/" className="mb-6">
          <h1 className="text-4xl font-extrabold text-red-400">StrongBerry</h1>
        </Link>
        <Card className="w-[420px] max-w-full shadow-lg">
          <CardContent className="p-8 space-y-6">
            <h2 className="text-xl font-bold ">비밀번호 찾기</h2>
            <input
              type="email"
              placeholder="이메일"
              className="w-full border p-3 rounded-xl "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {codeSent && (
              <input
                type="text"
                placeholder="인증코드 6자리"
                className="w-full border p-3 rounded-xl"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            )}

            {!codeSent ? (
              <Button className="w-full bg-red-300" onClick={sendCode}>
                인증번호 보내기
              </Button>
            ) : (
              <Button className="w-full bg-red-300" onClick={verifyCode}>
                인증하기
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
