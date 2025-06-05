// components/BoardPage.jsx
import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function BoardPage() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:8080/member/logout",
        {},
        {
          withCredentials: true,
        }
      );
      alert("로그아웃 되었습니다.");
      localStorage.removeItem("user");
      window.location.href = "/member/login"; // 로그인 페이지로 이동
    } catch (err) {
      alert("로그아웃 실패");
      console.error(err);
    }
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Board 페이지 (로그인 후 접근)</h2>
      <button onClick={goToProfile}>내 프로필 보기</button>
      <br />
      <br />
      <button onClick={handleLogout}>로그아웃</button>
      {/* 여기 게시글 목록 등 다른 컴포넌트도 포함 가능 */}
    </div>
  );
}

export default BoardPage;
