import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function BoardPage() {
  const navigate = useNavigate();
  // const user = JSON.parse(localStorage.getItem("user")); // 로그인된 사용자 정보

  // const handleLogout = async () => {
  //   try {
  //     await axios.post("http://localhost:8080/member/logout", {}, { withCredentials: true });
  //     alert("로그아웃 되었습니다.");
  //     localStorage.removeItem("user");
  //     window.location.href = "/member/login";
  //   } catch (err) {
  //     alert("로그아웃 실패");
  //     console.error(err);
  //   }
  // };

  const goToProfile = () => {
    navigate("/profile");
  };

  // const goToLogin = () => {
  //   navigate("/member/login");
  // };

  return (
    <div style={{ padding: 20 }}>
      <h2>Board 페이지</h2>

      <button onClick={goToProfile}>내 프로필 보기</button>
      <br />
      <br />

      {/* {user ? <button onClick={handleLogout}>로그아웃</button> : <button onClick={goToLogin}>로그인</button>} */}
    </div>
  );
}

export default BoardPage;
