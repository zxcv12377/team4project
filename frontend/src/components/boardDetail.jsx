import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReplyList from "./replyList";

export default function BoardDetail() {
  const { bno } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/boards/read/${bno}`)
      .then((res) => res.json())
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("게시글 조회 실패:", err);
        setLoading(false);
      });
  }, [bno]);

  if (loading) return <div className="text-center mt-10 text-gray-500">⏳ 게시글을 불러오는 중입니다...</div>;
  if (!post) return <div className="text-center mt-10 text-red-500">❌ 게시글이 존재하지 않습니다.</div>;

  const formattedRegDate = new Date(post.regDate).toLocaleString();
  const formattedModDate = new Date(post.modDate).toLocaleString();
  const isModified = post.regDate !== post.modDate;

  return (
    <div className="max-w-3xl mx-auto mt-24 p-6 bg-white shadow-md rounded-lg">
      {/* 게시글 제목 + 번호 */}
      <h2 className="text-2xl font-bold text-blue-700 mb-3">
        {post.title} <span className="text-sm text-gray-500">[{post.bno}]</span>
      </h2>

      {/* 작성자 & 작성일 */}
      <div className="text-sm text-gray-600 mb-1">
        작성자: {post.nickname ? post.nickname : "알 수 없음"} | {formattedRegDate}
      </div>

      {/* 수정일 (수정된 경우에만 표시) */}
      {isModified && <div className="text-sm text-gray-400 mb-4">수정일: {formattedModDate}</div>}

      {/* 본문 */}
      <div className="text-gray-900 whitespace-pre-wrap text-lg mb-6">{post.content}</div>

      {/* 버튼 */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          목록
        </button>
        <button
          onClick={() => navigate(`/edit/${post.bno}`)}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          수정
        </button>
        <button
          onClick={() => {
            if (window.confirm("정말 삭제하시겠습니까?")) {
              fetch(`/api/boards/delete/${post.bno}`, { method: "DELETE" })
                .then(() => navigate("/"))
                .catch((err) => console.error("삭제 실패:", err));
            }
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          삭제
        </button>
      </div>

      {/* 댓글 목록 컴포넌트 */}
      <ReplyList bno={post.bno} />
    </div>
  );
}
