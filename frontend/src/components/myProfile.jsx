import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:8080/member/me", {
        headers,
      });
      setProfile(res.data);
      setNickname(res.data.nickname);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // ✅ 닉네임이 공백이면 기존 닉네임 사용
      const newNickname = nickname.trim() !== "" ? nickname : profile.nickname;

      // 닉네임 수정
      await axios.put("http://localhost:8080/member/update", { nickname: newNickname }, { headers });

      // 비밀번호 수정
      if (currentPassword && newPassword) {
        await axios.put("http://localhost:8080/member/password", { currentPassword, newPassword }, { headers });
      }

      // 프로필 이미지 업로드
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        await axios.post("http://localhost:8080/member/profile-image", formData, {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setMessage("수정이 완료되었습니다.");
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      console.error(err);
      setMessage("수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("정말로 탈퇴하시겠습니까? 되돌릴 수 없습니다.")) return;

    try {
      await axios.delete("http://localhost:8080/member/delete", {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("token"); // 토큰 제거
      window.location.href = "/login"; // 로그인 페이지로 이동
    } catch (err) {
      console.error(err);
      setMessage("회원탈퇴 중 오류가 발생했습니다.");
    }
  };

  if (!profile) return <div>로딩 중...</div>;

  return (
    <div>
      <div className="absolute top-6 left-6">
        <a
          href="/board"
          className="text-white text-2xl font-extrabold tracking-wide hover:text-indigo-400 transition-colors"
        >
          STRONGBERRY
        </a>
      </div>
      <h2>내 프로필</h2>
      <img
        src={`http://localhost:8080/uploads/${profile.profileimg}`}
        alt="프로필 이미지"
        width="100"
        height="100"
        style={{ borderRadius: "50%" }}
      />
      <p>이메일: {profile.email}</p>
      <p>닉네임: {profile.nickname}</p>

      {!editMode ? (
        <div>
          <button onClick={() => setEditMode(true)} style={{ marginRight: "10px" }}>
            수정
          </button>
        </div>
      ) : (
        <form onSubmit={handleProfileUpdate}>
          <div>
            <label>닉네임:</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>

          <div>
            <label>현재 비밀번호:</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label>새 비밀번호:</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>

          <div>
            <label>프로필 이미지:</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </div>

          <button type="submit">저장</button>
          <button type="button" onClick={() => setEditMode(false)}>
            취소
          </button>
          {message && <p>{message}</p>}
          <button
            style={{
              marginTop: "2rem",
              backgroundColor: "red",
              color: "white",
            }}
            onClick={handleDeleteAccount}
          >
            회원 탈퇴
          </button>
        </form>
      )}

      {message && <p>{message}</p>}
    </div>
  );
};

export default MyProfile;
