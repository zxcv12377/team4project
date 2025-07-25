import axios from "axios";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const {
    state: { email },
  } = useLocation();
  const navigate = useNavigate();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");

  const submit = async () => {
    if (pw1 !== pw2) return alert("비밀번호가 일치하지 않습니다");
    await axios.post("/api/passwordreset/confirm", {
      email,
      newPassword: pw1,
    });
    alert("비밀번호가 변경되었습니다. 다시 로그인해 주세요.");
    navigate("/boards");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center gap-6">
        <Link to="/" className="mb-6">
          <h1 className="text-4xl font-extrabold text-red-500">StrongBerry</h1>
        </Link>
        <Card className="w-full max-w-md shadow-xl rounded-2xl">
          <CardContent className="p-8 space-y-6">
            <h2 className="text-2xl font-bold text-center">새 비밀번호 설정</h2>
            <input
              type="password"
              placeholder="새 비밀번호"
              className="w-full border p-3 rounded-xl"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
            />
            <input
              type="password"
              placeholder="비밀번호 확인"
              className="w-full border p-3 rounded-xl"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
            <Button className="w-full bg-red-300" onClick={submit}>
              비밀번호 변경
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
