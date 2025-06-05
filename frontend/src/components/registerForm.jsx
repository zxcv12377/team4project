import React, { useState } from "react";
import axios from "axios";

function RegisterForm() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 비밀번호 확인
  const [errorMsg, setErrorMsg] = useState(""); // 에러 메세지
  const [successMsg, setSuccessMsg] = useState(""); // 성공 메세지

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:8080/member/register",
        {
          nickname,
          email,
          password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      setSuccessMsg("회원가입 성공! 로그인해주세요.");
      setErrorMsg("");
      setNickname("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setSuccessMsg("");
      setErrorMsg(error.response?.data?.message || "회원가입 실패");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
      <br />
      <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <br />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <br />
      <input
        type="password"
        placeholder="비밀번호 확인"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      <br />
      <button type="submit">회원가입</button>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      {successMsg && <p style={{ color: "green" }}>{successMsg}</p>}
    </form>
  );
}

export default RegisterForm;
