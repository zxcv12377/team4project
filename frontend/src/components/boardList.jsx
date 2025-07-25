import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import axiosInstance from "../lib/axiosInstance";

export default function BoardList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    console.log("📡 useEffect 실행됨");
    boardList();
  }, []);

  const boardList = async () => {
    try {
      const res = await axiosInstance.get(`/boards/list?page=${page}&size=10`, { headers });
      console.log("📦 받은 데이터:", res.data);
      const data = res.data;
      setPosts(data.dtoList || []);
      setTotalPages(data.totalPage || 1);
    } catch (err) {
      console.error("게시글 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-6 text-gray-500">📦 게시글을 불러오는 중입니다...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-96px)] mt-[96px] bg-consilk">
      <main className="max-w-3xl mx-auto p-6 pt-10">
        {/* ✅ 질문등록 버튼 */}
        {token && (
          <div className="flex justify-end mb-4">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
              onClick={() => navigate("/boards/create")}
            >
              게시글 등록
            </button>
          </div>
        )}

        {/* 게시판 제목 */}
        <h2 className="text-2xl font-bold mb-4">📋 게시판 목록</h2>

        {/* 게시글 목록 */}
        {posts.length === 0 ? (
          <div className="text-center mt-6 text-gray-600">📭 게시글이 없습니다.</div>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li
                key={post.bno}
                onClick={() => navigate(`/boards/${post.bno}`)}
                className="flex justify-between items-start p-4 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow"
              >
                {/* 텍스트 영역 */}
                <div className="flex-1 pr-4">
                  <div className="text-blue-600 font-semibold text-lg">
                    <span className="text-gray-600 font-bold mr-2">[{post.bno}]</span>
                    {post.title}
                  </div>

                  <div className="text-sm text-gray-600 mt-1">
                    작성자: {post.nickname || "익명"} | 작성일:{" "}
                    {post.createdDate
                      ? new Date(post.createdDate).toLocaleString("ko-KR", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "날짜 없음"}{" "}
                    | 댓글 {typeof post.replyCount === "number" ? post.replyCount : 0}
                  </div>
                </div>

                {/* ✅ 안전한 썸네일 */}
                {Array.isArray(post.attachments) && post.attachments.length > 0 && (
                  <img
                    src={(() => {
                      const img = post.attachments[0];

                      // 🔒 안전: fallback 처리
                      if (typeof img === "string") {
                        return img.startsWith("http") ? img : `${baseURL}${img}`;
                      }

                      const src = img.thumbnailUrl || img.originalUrl || "";
                      return src.startsWith("http") ? src : `${baseURL}${src}`;
                    })()}
                    alt="썸네일"
                    className="w-32 h-20 object-cover rounded"
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {/* 페이지네이션 */}
        {posts.length > 0 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded border ${
                  page === i + 1 ? "bg-blue-500 text-white font-bold" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
