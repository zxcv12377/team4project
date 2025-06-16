import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RegisterForm = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
  });

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    try {
      await axios.post("http://localhost:8080/member/register", form);
      setSuccessMsg("회원가입이 완료되었습니다!");
      setForm({ email: "", password: "", nickname: "" });

      // 1초 후 인증코드 입력페이지로 이동
      setTimeout(() => {
        navigate("/verify-code");
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("회원가입 실패: 입력값을 확인하세요.");
    }
  };

  return (
    <div>
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>이메일:</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <label>비밀번호:</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </div>
        <div>
          <label>닉네임:</label>
          <input type="text" name="nickname" value={form.nickname} onChange={handleChange} required />
        </div>

        {error && <div style={{ color: "red" }}>{error}</div>}
        {successMsg && <div style={{ color: "green" }}>{successMsg}</div>}

        <button type="submit">회원가입</button>
      </form>
      <div style={{ marginTop: "1rem" }}>
        <button type="button" onClick={() => navigate("/login")}>
          로그인창으로
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;
