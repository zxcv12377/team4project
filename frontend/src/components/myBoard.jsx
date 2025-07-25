import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const fmt = (iso) => iso?.replace("T", " ").slice(0, 19) || "";

export default function MyBoard() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => loadPosts(), []);

  const loadPosts = () => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:8080/api/boards/my", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPosts(res.data));
  };

  const handleDelete = async (e, bno) => {
    e.stopPropagation();
    if (!window.confirm("정말로 게시글을 삭제하시겠습니까?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8080/api/boards/delete/${bno}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((p) => p.bno !== bno));
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-yellow-50 rounded-xl border border-yellow-200 shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-yellow-500 text-center">📝 내가 작성한 게시글</h2>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500">작성한 게시글이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.bno}
              onClick={() => navigate(`/boards/${post.bno}`)}
              className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md flex justify-between items-center border border-yellow-100 cursor-pointer transition"
            >
              {/* 제목 · 날짜 */}
              <div>
                <strong className="text-gray-800">{post.title}</strong>
                <div className="text-sm text-gray-500 mt-1">🗓 {fmt(post.updatedDate)}</div>
              </div>

              {/* 삭제 버튼 */}
              <button
                onClick={(e) => handleDelete(e, post.bno)}
                className="px-3 py-1 bg-red-400 text-white rounded hover:bg-red-500"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
