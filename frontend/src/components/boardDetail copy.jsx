import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";
import ReplyList from "./replyList";

const BoardDetail = () => {
  const { bno } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  // 현재 로그인한 사용자 정보 가져오기
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const baseImageUrl = import.meta.env.VITE_IMAGE_BASE_URL;

  useEffect(() => {
    axiosInstance
      .get(`/boards/read/${bno}`)
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

  const formattedDate = (date) =>
    date
      ? new Date(date).toLocaleString("ko-KR", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "날짜 없음";

  const isModified = post.createdDate !== post.updatedDate;

  return (
    <div className="max-w-3xl mx-auto mt-24 p-6 bg-white shadow-md rounded-lg">
      <header className="mb-4">
        <h2 className="text-2xl font-bold text-blue-700 mb-1">
          {post.title} <span className="text-sm text-gray-500">[{post.bno}]</span>
        </h2>
        <div className="text-sm text-gray-600">
          작성자: {post.nickname || "알 수 없음"} | 작성일: {formattedDate(post.createdDate)}
        </div>
        {isModified && <div className="text-sm text-gray-400">수정일: {formattedDate(post.updatedDate)}</div>}
      </header>

      {/* HTML 본문 렌더링 */}
      <article
        className="prose prose-img:rounded-lg prose-img:shadow text-gray-900 max-w-none text-lg mb-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* 첨부 이미지 썸네일 */}
      {post.attachments?.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">📎 첨부 이미지</h3>
          <div className="flex flex-wrap gap-4">
            {post.attachments.map((img, idx) => {
              const fullThumb = img.thumbnailUrl?.startsWith("http")
                ? img.thumbnailUrl
                : `${baseImageUrl}${img.thumbnailUrl}`;
              return (
                <img
                  key={idx}
                  src={fullThumb}
                  alt={`첨부 이미지 ${idx + 1}`}
                  className="w-32 h-32 object-cover rounded shadow"
                />
              );
            })}
          </div>
        </section>
      )}

      {/* 버튼 영역 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => navigate("/boards")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          목록
        </button>

        {/* 작성자 본인일 때만 수정/삭제 버튼 노출 */}
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
                  axiosInstance
                    .delete(`/boards/delete/${post.bno}`)
                    .then(() => navigate("/boards"))
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
