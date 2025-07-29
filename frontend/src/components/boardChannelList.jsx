import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";

export default function BoardChannelList() {
  const [channels, setChannels] = useState([]);
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  /* 채널 로딩 */
  useEffect(() => {
    axiosInstance
      .get("/board-channels")
      .then((res) => setChannels(res.data))
      .catch((err) => console.error("채널 로딩 실패:", err));
  }, []);

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
            <li
              key={ch.id}
              onClick={() => navigate(`/channels/${ch.id}`)}
              className="cursor-pointer bg-white rounded-lg border border-gray-200 shadow hover:shadow-lg p-4 flex flex-col items-center text-center transition"
            >
              <span className="text-lg font-semibold text-gray-800 mb-2">#{ch.name}</span>
              {ch.description && <p className="text-sm text-gray-500 line-clamp-2">{ch.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
