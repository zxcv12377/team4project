import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const UpdateMyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [nickname, setNickname] = useState("");
  const [file, setFile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:8080/member/me", { headers });
      if (!res.data || !res.data.nickname) {
        throw new Error("프로필 응답 데이터가 올바르지 않습니다.");
      }
      setProfile(res.data);
      setNickname(res.data.nickname);
    } catch (err) {
      if (err.response?.status === 401) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError("프로필 정보를 불러오지 못했습니다.");
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (selectedFile && selectedFile.size > maxSize) {
      alert("10MB 이하의 이미지만 업로드 가능합니다.");
      e.target.value = null; // 선택된 파일 초기화
      return;
    }

    setFile(selectedFile);
  };

  const uploadProfileImage = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("http://localhost:8080/member/profile-image", formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setMessage(" 이미지 업로드 성공");
      setTimeout(() => {
        navigate("/UpdateProfile");
        window.location.reload();
      }, 1000);
      setError("");
      fetchProfile();
    } catch (err) {
      if (err.response?.status === 401) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("token");
        navigate("/login");
      }
      setError("❌ 이미지 업로드 실패");
      setMessage("");
    }
  };

  const updateNickname = async () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    try {
      await axios.put("http://localhost:8080/member/update", { nickname }, { headers });
      setMessage(" 닉네임 변경 성공");
      setTimeout(() => {
        navigate("/UpdateProfile");
        window.location.reload();
      }, 1000);
      setError("");
      fetchProfile();
    } catch (err) {
      if (err.response?.status === 401) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("token");
        navigate("/login");
      }
      setError("❌ 닉네임 변경 실패");
      setMessage("");
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      setError("비밀번호를 모두 입력해주세요.");
      return;
    }

    if (newPassword.length < 4) {
      setError("새 비밀번호는 최소 4자 이상이어야 합니다.");
      return;
    }

    try {
      await axios.put("http://localhost:8080/member/password", { currentPassword, newPassword }, { headers });
      setMessage(" 비밀번호 변경 성공");
      setError("");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      if (err.response?.status === 401) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("token");
        navigate("/login");
      }
      setError("❌ 비밀번호 변경 실패");
      setMessage("");
    }
  };

  const deleteMember = async () => {
    if (!window.confirm("정말 탈퇴하시겠습니까?")) return;
    try {
      await axios.delete("http://localhost:8080/member/delete", { headers });
      localStorage.removeItem("token");
      alert("회원 탈퇴가 완료되었습니다.");
      navigate("/login");
    } catch (err) {
      if (err.response?.status === 401) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("token");
        navigate("/login");
      }
      setError("❌ 회원 탈퇴 실패");
    }
  };

  if (!profile) return <div className="text-center mt-10">로딩 중...</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-xl mt-10 space-y-6">
      <Link to="/profile">
        <h2 className="text-4xl font-bold text-center text-red-500 ">내 프로필</h2>
      </Link>

      <img
        src={`http://localhost:8080/uploads/${profile.profileimg}`}
        alt="프로필 이미지"
        className="w-36 h-36 object-cover rounded-full mx-auto"
      />

      <div className="flex flex-col items-center gap-2">
        <input type="file" onChange={handleFileChange} />
        <button
          onClick={uploadProfileImage}
          disabled={!file}
          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          이미지 업로드
        </button>
      </div>

      <div className="space-y-2">
        <label className="block">닉네임</label>
        <input
          type="text"
          maxLength={8}
          className="w-full p-2 border rounded"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <button
          onClick={updateNickname}
          disabled={!nickname.trim()}
          className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          닉네임 변경
        </button>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold">비밀번호 변경</h4>
        <input
          type="password"
          placeholder="현재 비밀번호"
          className="w-full p-2 border rounded"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="새 비밀번호"
          className="w-full p-2 border rounded"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button
          onClick={changePassword}
          disabled={!currentPassword || !newPassword}
          className="w-full py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          비밀번호 변경
        </button>
      </div>

      <button onClick={deleteMember} className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600">
        회원 탈퇴
      </button>

      {message && <div className="text-green-600 text-center">{message}</div>}
      {error && <div className="text-red-600 text-center">{error}</div>}
    </div>
  );
};

export default UpdateMyProfile;
