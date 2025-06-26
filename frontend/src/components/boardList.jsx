import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function BoardList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // 게시글 목록 로딩
  useEffect(() => {
    boardList();
  }, [page]);

  const boardList = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/boards/list?page=${page}&size=10`, { headers });
      const data = res.data;
      setPosts(data.dtoList || []);
      setTotalPages(Math.max(1, data.totalPage));
    } catch (err) {
      if (err.response?.status === 401) {
        alert("로그인이 필요합니다.");
        navigate("/boards");
      } else {
        console.error("게시글 로딩 실패:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-6 text-gray-500">📦 게시글을 불러오는 중입니다...</div>;
  }

  if (posts.length === 0) {
    return <div className="text-center mt-6 text-gray-600">📭 게시글이 없습니다.</div>;
  }

  return (
    <div className="min-h-[calc(100vh-96px)] mt-[96px] bg-consilk">
      <main className="max-w-3xl mx-auto p-6 pt-10">
        {/* 질문등록 버튼 */}
        {token && (
          <div className="flex justify-end mb-4">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
              onClick={() => navigate("/board/create")}
            >
              질문등록
            </button>
          </div>
        )}

        {/* 게시판 제목 */}
        <h2 className="text-2xl font-bold mb-4">📋 게시판 목록</h2>

        {/* 게시글 목록 */}
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.bno}
              onClick={() => navigate(`/board/${post.bno}`)}
              className="cursor-pointer p-4 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow"
            >
              <div className="text-blue-600 font-semibold text-lg">
                <span className="text-gray-600 font-bold mr-2">[{post.bno}]</span>
                {post.title}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                작성자: {post.nickname || "익명"} | {new Date(post.regDate).toLocaleString()} | 댓글{" "}
                {post.replyCount ?? 0}
              </div>
            </li>
          ))}
        </ul>

        {/* 페이지네이션 */}
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
      </main>
    </div>
  );
}
