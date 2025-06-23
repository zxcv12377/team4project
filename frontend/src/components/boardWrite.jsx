import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function BoardWrite() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    try {
      await axios.post(
        "http://localhost:8080/api/boards/write",
        {
          title,
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("작성 완료");
      navigate("/boardList");
    } catch (error) {
      console.error(error);
      alert("작성 실패");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto text-white">
      <h2 className="text-2xl font-bold mb-4">게시글 작성</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white"
          required
        />
        <textarea
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white h-48"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          작성
        </button>
      </form>
    </div>
  );
}

export default BoardWrite;
