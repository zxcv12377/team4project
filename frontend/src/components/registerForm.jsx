import React, { useState } from "react";
import axios from "axios";

function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    nickname: "",
    password: "",
    token: "",
  });

  const [step, setStep] = useState("input"); // "input" | "code"
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const requestEmailVerification = async () => {
    try {
      await axios.post("http://localhost:8080/email/send", {
        email: formData.email,
      });
      alert("인증 코드가 이메일로 전송되었습니다.");
      setStep("code"); // 인증 코드 입력 단계로 전환
    } catch (error) {
      alert(error.response?.data?.message || "인증 요청 실패");
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      await axios.post("http://localhost:8080/email/verify", formData);
      alert("회원가입 성공!");
      // 로그인 페이지로 이동하거나 상태 초기화
      window.location.href = "/login";
    } catch (error) {
      alert(error.response?.data?.message || "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>회원가입</h2>

      <input
        type="email"
        name="email"
        placeholder="이메일"
        value={formData.email}
        onChange={handleChange}
        disabled={step === "code"}
      />
      <input
        type="text"
        name="nickname"
        placeholder="닉네임"
        value={formData.nickname}
        onChange={handleChange}
        disabled={step === "code"}
      />
      <input
        type="password"
        name="password"
        placeholder="비밀번호"
        value={formData.password}
        onChange={handleChange}
        disabled={step === "code"}
      />

      {step === "code" && (
        <input
          type="text"
          name="token"
          placeholder="인증 코드 입력"
          value={formData.token}
          onChange={handleChange}
        />
      )}

      {step === "input" ? (
        <button type="button" onClick={requestEmailVerification}>
          이메일 인증
        </button>
      ) : (
        <button type="button" onClick={handleRegister} disabled={loading}>
          {loading ? "회원가입 중..." : "회원가입"}
        </button>
      )}
    </div>
  );
}

export default RegisterForm;
