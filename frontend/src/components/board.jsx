// components/BoardPage.jsx
import React from "react";
import axios from "axios";

function BoardPage() {
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
      window.location.href = "/"; // 로그인 페이지로 이동
    } catch (err) {
      alert("로그아웃 실패");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Board 페이지 (로그인 후 접근)</h2>
      <button onClick={handleLogout}>로그아웃</button>
      {/* 여기 게시글 목록 등 다른 컴포넌트도 포함 가능 */}
    </div>
  );
}

export default BoardPage;
