import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useUserContext } from "@/context/UserContext";

export default function BoardModify() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { bno } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const getData = async () => {
      try {
        await axios.get(`http://localhost:8080/api/boards/read/${bno}`, { title, content }, { headers }).then((e) => {
          const { title, content } = e.data;
          setTitle(title);
          setContent(content);
        });
      } catch (error) {
        console.error("게시글 정보 가져오기 실패:", error);
        alert("게시글 등록에 실패했습니다.");
      }
    };
    getData();
  }, [bno]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      await axios.put(`http://localhost:8080/api/boards/update/${bno}`, { title, content }, { headers });
      alert("게시글이 성공적으로 수정되었습니다.");
      navigate(`/boards/${bno}`);
    } catch (error) {
      console.log("게시글 수정에 실패했습니다 : ", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-24 p-6  rounded-lg">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">📝 게시글 작성</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-700 font-medium">제목</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />
        </div>
        <div>
          <label className="block mb-1 text-gray-700 font-medium">내용</label>
          <textarea
            className="w-full h-40 px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring focus:ring-blue-200"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            취소
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            등록
          </button>
        </div>
      </form>
    </div>
  );
}
