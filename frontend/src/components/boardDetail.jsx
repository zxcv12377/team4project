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
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  /* ─── 게시글 조회 ───────────────────────────────── */
  useEffect(() => {
    axiosInstance
      .get(`/boards/read/${bno}`)
      .then((res) => setPost(res.data))
      .catch((err) => console.error("게시글 조회 실패:", err))
      .finally(() => setLoading(false));
  }, [bno]);

  if (loading) return <div className="mt-10 text-center text-gray-500">⏳ 게시글을 불러오는 중입니다...</div>;
  if (!post) return <div className="mt-10 text-center text-red-500">❌ 게시글이 존재하지 않습니다.</div>;

  /* ─── 날짜 포맷 ─────────────────────────────────── */
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString("ko-KR", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "날짜 없음";

  const created = fmt(post.createdDate);
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
      const {liked, likeCount} = res.data;
      setLike(liked);
      setLikeCount(likeCount);
      alert(liked ? "추천 완료" : "추천 취소");
    } catch (error) {
      console.error("추천 에러 : ",error);
      alert("추천 처리 중 오류가 발생했습니다.");
    }
  };

  /* ─── 렌더 ──────────────────────────────────────── */
  return (
    <div className="mx-auto mt-24 max-w-3xl rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-3 text-2xl font-bold text-blue-700">
        {post.title} <span className="text-sm text-gray-500">[{post.bno}]</span>
      </h2>

      <div className="mb-1 text-sm text-gray-600">
        작성자: {post.nickname || "알 수 없음"}
        {"  |  조회수: "}
        {post.viewCount ?? 0}
        {"  |  작성일: "}
        {created}
      </div>
      {/* {isModified && <div className="mb-4 text-sm text-gray-400">수정일: {updated}</div>} */}

      <div className="mb-6 whitespace-pre-wrap text-lg text-gray-900 h-[50rem] overflow-y-auto mt-6 border-t-2 pt-6">
        {post.content}
      </div>

      {Array.isArray(post.attachments) && post.attachments.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-2">
          {post.attachments.map((img, i) => {
            const src = typeof img === "string" ? img : img.thumbnailUrl || img.originalUrl || "";
            const finalSrc = src.startsWith(import.meta.env.VITE_HTTP_URL) ? src : `${baseURL}${src}`;
            return <img key={i} src={finalSrc} alt={`첨부-${i}`} className="h-32 w-full rounded border object-cover" />;
          })}
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="grid grid-cols-3 items-center py-4 bg-white rounded-lg">
        <div className="flex space-x-2">
          <button onClick={goList} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            목록
          </button>

          {currentUser?.id === post.memberid && (
            <>
              <button onClick={goUpdate} className="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600">
                수정
              </button>
              <button onClick={handleDelete} className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600">
                삭제
              </button>
            </>
          )}
        </div>
        <div className="flex justify-center">
          <button className="px-4 py-3 bg-gray-500 text-red-200 rounded hover:bg-gray-600 rounded-full" onClick={boardLike}>
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
