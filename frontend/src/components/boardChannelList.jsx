// src/components/BoardChannelList.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";
import { useUserContext } from "./../context/UserContext";

export default function BoardChannelList() {
  const [channels, setChannels] = useState([]);
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();
  const { user } = useUserContext();

  // 관리자 여부 판단
  const isAdmin = Boolean(
    user && (user.role === "ADMIN" || (Array.isArray(user.roles) && user.roles.includes("ADMIN")))
  );

  /* 채널 로딩 */
  useEffect(() => {
    axiosInstance
      .get("/board-channels")
      .then((res) => setChannels(res.data))
      .catch((err) => console.error("채널 로딩 실패:", err));
  }, []);

  /* 삭제 핸들러 */
  const handleDelete = (id) => {
    if (!window.confirm("정말 이 채널을 삭제하시겠습니까?")) return;
    axiosInstance
      .delete(`/board-channels/${id}`)
      .then(() => setChannels((prev) => prev.filter((ch) => ch.id !== id)))
      .catch((err) => console.error("채널 삭제 실패:", err));
  };

  /* 수정 핸들러 */
  const handleEdit = (id) => {
    navigate(`/admin/channels/edit/${id}`);
  };

  /* 필터링된 채널 */
  const filtered = channels.filter((c) => c.name.toLowerCase().includes(keyword.trim().toLowerCase()));

  return (
    <div className="mx-auto mt-24 max-w-7xl p-6">
      {/* 제목 + 검색 */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">채널 목록</h2>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="채널 검색..."
          className="w-full sm:w-64 rounded border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* 카드형 그리드 */}
      {filtered.length === 0 ? (
        <div className="text-gray-600">{keyword ? "검색 결과가 없습니다." : "채널이 없습니다."}</div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {filtered.map((ch) => (
            <li key={ch.id} className="flex items-start">
              {/* 채널 박스 */}
              <div
                onClick={() => navigate(`/channels/${ch.id}`)}
                className="flex-1 cursor-pointer bg-white rounded-lg border border-gray-200 shadow hover:shadow-lg p-4 flex flex-col items-center text-center transition"
              >
                <span className="text-lg font-semibold text-gray-800 mb-2">{ch.name}</span>
                {ch.description && <p className="text-sm text-gray-500 line-clamp-2">{ch.description}</p>}
              </div>

              {/* 관리자일 때만 — 채널 박스 외부, 오른쪽에 세로 정렬 */}
              {isAdmin && (
                <div className="ml-3 flex flex-col space-y-1 self-start">
                  <button
                    className="text-blue-500 hover:underline text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(ch.id);
                    }}
                  >
                    수정
                  </button>
                  <button
                    className="text-red-500 hover:underline text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(ch.id);
                    }}
                  >
                    삭제
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
