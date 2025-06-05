import React, { useEffect, useState } from "react";
import axios from "axios";

function MyProfile() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [profileimg, setProfileimg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState("");

  // 사용자 정보 불러오기
  useEffect(() => {
    axios
      .get("http://localhost:8080/member/me", { withCredentials: true })
      .then((res) => {
        const user = res.data;
        setNickname(user.nickname);
        setEmail(user.email);
        setProfileimg(user.profileimg);
      })
      .catch(() => {
        setMessage("사용자 정보를 불러오지 못했습니다.");
      });
  }, []);

  // 기본 정보 수정
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        "http://localhost:8080/member/update",
        {
          email,
          profileimg,
        },
        {
          withCredentials: true,
        }
      );
      setMessage("정보가 성공적으로 수정되었습니다.");
    } catch {
      setMessage("정보 수정 실패");
    }
  };

  // 비밀번호 변경
  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        "http://localhost:8080/member/password",
        {
          currentPassword,
          newPassword,
        },
        {
          withCredentials: true,
        }
      );
      setMessage("비밀번호 변경 완료!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(err.response?.data || "비밀번호 변경 실패");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>내 정보</h2>

      {profileimg && (
        <div style={{ marginBottom: "1rem" }}>
          <img
            src={profileimg}
            alt="프로필 이미지"
            style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }}
          />
        </div>
      )}

      <form onSubmit={handleProfileUpdate}>
        <p>닉네임: {nickname}</p>
        <label>이메일:</label>
        <br />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <br />

        <label>프로필 이미지 URL:</label>
        <br />
        <input type="text" value={profileimg} onChange={(e) => setProfileimg(e.target.value)} />
        <br />

        <button type="submit">정보 수정</button>
      </form>

      <hr />

      <h3>비밀번호 변경</h3>
      <form onSubmit={handleChangePassword}>
        <label>현재 비밀번호:</label>
        <br />
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        <br />

        <label>새 비밀번호:</label>
        <br />
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        <br />

        <button type="submit">비밀번호 변경</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default MyProfile;
