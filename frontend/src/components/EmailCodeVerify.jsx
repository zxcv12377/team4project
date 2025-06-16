import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function EmailCodeVerify() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post("http://localhost:8080/email/verify", {
        email,
        code,
      });

      setMessage("✅ 이메일 인증 성공! 로그인 페이지로 이동합니다...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data || "❌ 인증 실패: 올바른 코드인지 확인해주세요.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>이메일 인증</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>이메일:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>인증 코드:</label>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={4} />
        </div>
        <button type="submit">인증하기</button>
      </form>
      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}
