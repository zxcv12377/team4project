// src/pages/BoardRead.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import ReplyList from "../components/replyList"; // 경로는 실제 위치에 맞게 조정하세요

export default function BoardRead() {
  const { bno } = useParams();
  const [board, setBoard] = useState(null);
  const navigate = useNavigate();

  // JWT 토큰에서 userId 추출
  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (e) {
      console.error("토큰 파싱 실패", e);
      return null;
    }
  };
  const currentUserId = getUserIdFromToken();

  // 게시글 조회
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`http://localhost:8080/api/boards/read/${bno}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => setBoard(res.data))
      .catch((err) => {
        console.error(err);
        alert("게시글을 불러오는 데 실패했습니다.");
      });
  }, [bno]);

  // 수정
  const handleEdit = () => {
    navigate(`/board/edit/${bno}`);
  };

  // 삭제
  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      await axios.delete(`http://localhost:8080/api/boards/delete/${bno}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("삭제되었습니다.");
      navigate("/boardList");
    } catch (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (!board) return <div>로딩 중...</div>;

  // 본인 게시글 여부 판단
  const isMyBoard = Number(currentUserId) === Number(board.memberId);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h2 className="text-3xl font-bold">{board.title}</h2>
      <p className="text-gray-700 whitespace-pre-wrap">{board.content}</p>

      {isMyBoard && (
        <div className="flex justify-end gap-2">
          <button
            onClick={handleEdit}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            삭제
          </button>
        </div>
      )}

      {/* 댓글 기능 */}
      <ReplyList bno={bno} />
    </div>
  );
}
