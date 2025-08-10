// src/pages/BoardSearch.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";

export default function BoardSearch() {
  const { search } = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(search);
  const type = params.get("type");
  const keyword = params.get("keyword");
  const page = parseInt(params.get("page") || "1", 10);

  const [channelsMap, setChannelsMap] = useState({});
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // 1) 채널 맵 로딩 (키를 문자열로)
  useEffect(() => {
    axiosInstance
      .get("/board-channels")
      .then((res) => {
        const map = {};
        res.data.forEach((ch) => {
          map[String(ch.id)] = ch.name;
        });
        setChannelsMap(map);
      })
      .catch(console.error);
  }, []);

  // 2) 검색 결과 로딩
  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get(
        `/boards/list?` +
          `type=${encodeURIComponent(type || "")}` +
          `&keyword=${encodeURIComponent(keyword || "")}` +
          `&page=${page}&size=10`
      )
      .then((res) => {
        const data = res.data;
        setResults(data.dtoList || []);
        setTotalPages(data.totalPage || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type, keyword, page]);

  const formatDate = (iso) => {
    const d = new Date(iso);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yy}-${mm}-${dd} ${hh}:${mi}`;
  };

  if (loading) {
    return <div className="mt-6 text-center text-gray-500">🔍 검색 결과를 불러오는 중입니다...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-96px)] mt-[96px] bg-consilk">
      <main className="mx-auto max-w-3xl p-6 pt-10">
        <h2 className="mb-4 text-2xl font-bold">🔍 검색: “{keyword}”</h2>

        {results.length === 0 ? (
          <div className="mt-6 text-center text-gray-600">검색 결과가 없습니다.</div>
        ) : (
          <>
            <ul className="space-y-4">
              {results.map((b) => (
                <li
                  key={b.bno}
                  className="rounded-lg bg-white p-4 shadow hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/channels/${b.channelId}/${b.bno}`)}
                >
                  <span className="inline-block bg-black text-white text-xs font-semibold px-2 py-0.5 rounded mb-2">
                    채널 : {channelsMap[String(b.channelId)] ?? "알 수 없는 채널"}
                  </span>
                  <h3 className="text-xl font-semibold mb-1">{b.title}</h3>
                  <p className="text-gray-500 text-sm">
                    작성자: {b.nickname || "익명"} | {formatDate(b.createdDate)}
                  </p>
                  <p className="text-gray-500 text-sm">
                    조회수: {b.viewCount} | 추천: {b.boardLikeCount}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex justify-center items-center space-x-3">
              <button
                disabled={page <= 1}
                onClick={() => navigate(`?type=${type}&keyword=${keyword}&page=${page - 1}`)}
                className="px-3 py-1 bg-white border rounded disabled:opacity-50"
              >
                이전
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => navigate(`?type=${type}&keyword=${keyword}&page=${page + 1}`)}
                className="px-3 py-1 bg-white border rounded disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
