import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const uploadURL = import.meta.env.VITE_FILE_UPLOAD_URL;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get("/members/me", { headers });
      setProfile(res.data);
      setComment(res.data.comment || "");
    } catch (err) {
      if (err.response?.status === 401) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("token");
        navigate("/boards");
      } else {
        setError("프로필 정보를 불러오지 못했습니다.");
      }
    }
  };

  const updateComment = async () => {
    try {
      await axiosInstance.put("/members/comment", { comment }, { headers });
      setMessage(" 코멘트가 저장되었습니다.");
      setError("");
      fetchProfile();
    } catch (err) {
      setMessage("err");
      setError("코멘트 저장 실패");
    }
  };

  if (!profile) return <div className="text-center mt-10">로딩 중...</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-xl mt-10 space-y-6">
      <h2 className="text-4xl font-extrabold text-center text-red-500">내 프로필</h2>

      <img
        src={`uploadURL/${profile.profileimg}`}
        alt="프로필 이미지"
        className="w-36 h-36 object-cover rounded-full mx-auto"
      />

      <p className="text-center text-2xl font-semibold mt-4">{profile.nickname}</p>

      <div className="mt-6">
        <label className="block mb-2 text-m font-medium text-gray-700">내 소개</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full h-24 p-2 border rounded resize-none"
          maxLength={500}
          placeholder="자기소개나 한 마디를 남겨보세요"
        />
        <button onClick={updateComment} className="mt-2 w-full py-2 bg-yellow-500 text-white rounded hover:bg-blue-600">
          코멘트 저장
        </button>
        <button
          className="mt-2 w-full py-2 bg-red-400 text-white rounded hover:bg-blue-600"
          onClick={() => navigate("/UpdateProfile")}
        >
          수정하기
        </button>
      </div>

      {message && <div className="text-green-600 text-center">{message}</div>}
      {error && <div className="text-red-600 text-center">{error}</div>}
    </div>
  );
};

export default MyProfile;
