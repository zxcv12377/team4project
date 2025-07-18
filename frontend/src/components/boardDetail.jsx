import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReplyList from "./replyList";

const BoardDetail = () => {
  const { bno } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // 현재 로그인한 사용자 정보 가져오기
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    axios
      .get(`/api/boards/read/${bno}`)
      .then((res) => {
        setPost(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("게시글 조회 실패:", err);
        setLoading(false);
      });
  }, [bno]);

  if (loading) return <div className="text-center mt-10 text-gray-500">⏳ 게시글을 불러오는 중입니다...</div>;
  if (!post) return <div className="text-center mt-10 text-red-500">❌ 게시글이 존재하지 않습니다.</div>;

  const formattedCreated = post.createdDate
    ? new Date(post.createdDate).toLocaleString("ko-KR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "날짜 없음";

  const formattedUpdated = post.updatedDate
    ? new Date(post.updatedDate).toLocaleString("ko-KR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const isModified = post.createdDate !== post.updatedDate;

  return (
    <div className="max-w-3xl mx-auto mt-24 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-blue-700 mb-3">
        {post.title} <span className="text-sm text-gray-500">[{post.bno}]</span>
      </h2>

      <div className="text-sm text-gray-600 mb-1">
        작성자: {post.nickname || "알 수 없음"} | 작성일: {formattedCreated}
      </div>
      {isModified && <div className="text-sm text-gray-400 mb-4">수정일: {formattedUpdated}</div>}

      <div className="text-gray-900 whitespace-pre-wrap text-lg mb-6">{post.content}</div>

      {Array.isArray(post.attachments) && post.attachments.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {post.attachments.map((img, index) => {
            const src = img.thumbnailUrl || img.originalUrl || "";
            const finalSrc = src.startsWith("http") ? src : `http://localhost:8080${src}`;
            return (
              <img
                key={index}
                src={finalSrc}
                alt={`첨부이미지-${index}`}
                className="w-full h-32 object-cover rounded border"
              />
            );
          })}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          목록
        </button>
        {/* ✅ 작성자 본인일 때만 수정/삭제 버튼 노출 */}
        {currentUser?.id === post.memberid && (
          <>
            <button
              onClick={() => navigate(`/boards/update/${post.bno}`)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              수정
            </button>

            <button
              onClick={() => {
                if (window.confirm("정말 삭제하시겠습니까?")) {
                  axios
                    .delete(`/api/boards/delete/${post.bno}`)
                    .then(() => navigate("/"))
                    .catch((err) => console.error("삭제 실패:", err));
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              삭제
            </button>
          </>
        )}
      </div>

      <ReplyList bno={post.bno} />
    </div>
  );
};

export default BoardDetail;
