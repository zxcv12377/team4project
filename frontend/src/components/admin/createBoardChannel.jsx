// src/pages/createBoardChannel.jsx
import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axiosInstance from "@/lib/axiosInstance";
import { useUserContext } from "@/context/UserContext";

export default function CreateBoardChannel() {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // 비관리자 차단
  if (!user?.roles?.includes("ADMIN")) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // name 과 description 둘 다 서버로 전송
      await axiosInstance.post("/board-channels", { name, description });
      alert("채널이 등록되었습니다.");
      navigate("/boardChannels"); // 채널 목록으로 이동
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "채널 생성 실패");
    }
  };

  return (
    <div className="mx-auto mt-24 max-w-md p-6 bg-white rounded shadow">
      <h2 className="mb-6 text-2xl font-bold">채널 생성</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">채널 이름</label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring"
            placeholder="채널 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">설명</label>
          <textarea
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring"
            placeholder="채널 설명을 입력하세요"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 transition"
        >
          생성
        </button>
      </form>
    </div>
  );
}
