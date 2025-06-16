import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function EmailVerificationResult() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("인증 중입니다...");
  const tokenParam = searchParams.get("token");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAndLogin = async () => {
      try {
        const verifyRes = await axios.get(`http://localhost:8080/email/verify?token=${tokenParam}`);
        setMessage("✅ 이메일 인증이 완료되었습니다. 자동 로그인 중...");

        // 인증된 사용자 이메일 추출
        const email = new URLSearchParams(window.location.search).get("email");
        const password = localStorage.getItem("tempPassword"); // 회원가입 시 저장해둔 임시 비밀번호

        if (!email || !password) {
          setMessage("✅ 인증은 완료되었지만 자동 로그인 정보가 없습니다.");
          return;
        }

        const loginRes = await axios.post("http://localhost:8080/member/login", {
          email,
          password,
        });

        localStorage.setItem("token", loginRes.data.token);
        setMessage("🎉 자동 로그인 성공! 프로필 페이지로 이동합니다...");
        setTimeout(() => navigate("/profile"), 2000);
      } catch (err) {
        setMessage("❌ 인증 또는 자동 로그인 실패: " + err.response?.data || err.message);
      }
    };

    if (tokenParam) verifyAndLogin();
    else setMessage("❌ 인증 토큰이 없습니다.");
  }, [tokenParam]);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>이메일 인증 결과</h2>
      <p>{message}</p>
    </div>
  );
}
