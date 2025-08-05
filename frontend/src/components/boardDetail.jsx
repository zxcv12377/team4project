import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axiosInstance";
import ReplyList from "./replyList";

const BoardDetail = () => {
  /* ─── URL 파라미터 ──────────────────────────────── */
  const { channelId, bno } = useParams(); // /channels/:channelId/:bno
  const navigate = useNavigate();

  /* ─── 상태 ──────────────────────────────────────── */
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [like, setLike] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const baseImageUrl = import.meta.env.VITE_IMAGE_BASE_URL;
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  /* ─── 게시글 조회 ───────────────────────────────── */
  useEffect(() => {
    axiosInstance
      .get(`/boards/read/${bno}`)
      .then((res) => setPost(res.data))
      .catch((err) => console.error("게시글 조회 실패:", err))
      .finally(() => setLoading(false));
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

  // const updated = fmt(post.updatedDate);
  // const isModified = post.createdDate !== post.updatedDate;

  /* ─── 헬퍼 ──────────────────────────────────────── */
  const goList = () => navigate(`/channels/${channelId}`);
  const goUpdate = () => navigate(`/channels/${channelId}/update/${post.bno}`);

  const handleDelete = () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    axiosInstance
      .delete(`/boards/delete/${post.bno}`)
      .then(goList)
      .catch((err) => console.error("삭제 실패:", err));
  };

  const boardLike = async () => {
    try {
      const res = await axiosInstance.post(`/boards/${post.bno}/like`);
      const { liked, likeCount } = res.data;
      setLike(liked);
      setLikeCount(likeCount);
      alert(liked ? "추천 완료" : "추천 취소");
    } catch (error) {
      console.error("추천 에러 : ", error);
      alert("추천 처리 중 오류가 발생했습니다.");
    }
  };

  /* ─── 렌더 ──────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto mt-24 p-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">
        📄 {post.title}
        <span className="ml-2 text-sm text-gray-500">[{post.bno}]</span>
      </h2>

      <div className="text-sm text-gray-600 mb-1">
        작성자: {post.nickname || "알 수 없음"} | 조회수: {post.viewCount ?? 0} | 작성일:{" "}
        {formattedDate(post.createdDate)}
      </div>
      {/* {isModified && <div className="mb-4 text-sm text-gray-400">수정일: {updated}</div>} */}

      <article
        className="prose prose-img:rounded-lg prose-img:shadow text-gray-900 max-w-none text-lg mb-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* 첨부 이미지 썸네일 */}
      {post.attachments?.length > 0 && (
        <section className="mb-8">
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

      <div className="flex justify-end gap-2 mb-6">
        <button
          onClick={() => navigate("/boards")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          목록
        </button>

        {currentUser?.id === post.memberid && (
          <>
            <button
              onClick={() => navigate(`/channels/${channelId}/update/${post.bno}`)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              수정
            </button>
            <button
              onClick={() => {
                if (window.confirm("정말 삭제하시겠습니까?")) {
                  axiosInstance
                    .delete(`/boards/delete/${post.bno}`)
                    .then(() => navigate(`/channels/${channelId}`))
                    .catch((err) => console.error("삭제 실패:", err));
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              삭제
            </button>
          </>
        )}
        <div className="flex justify-center">
          <button
            className="px-4 py-3 bg-gray-500 text-red-200 rounded hover:bg-gray-600 rounded-full"
            onClick={boardLike}
          >
            VERY!
            <div className="text-white">{likeCount}</div>
          </button>
        </div>
      </div>

      <ReplyList bno={post.bno} />
    </div>
  );
};

export default BoardDetail;
