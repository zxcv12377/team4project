import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import axiosInstance from "../lib/axiosInstance";
import ReplyList from "./replyList";

const BoardDetail = () => {
  const { channelId, bno } = useParams(); // /channels/:channelId/:bno
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [like, setLike] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const baseImageUrl = import.meta.env.VITE_IMAGE_BASE_URL;

  useEffect(() => {
    if (post) {
      setLikeCount(post.boardLikeCount || 0);
      setLike(!!post.like);
    }
  }, [post]);

  useEffect(() => {
    axiosInstance
      .get(`/boards/read/${bno}`)
      .then((res) => {
        setPost(res.data);
        setLikeCount(res.data.boardLikeCount || 0);
      })
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
    if (!currentUser) {
      alert("로그인 후 이용해 주세요.");
      return;
    }

    try {
      const res = await axiosInstance.post(`/boards/${post.bno}/like`);
      const { liked, likeCount } = res.data;
      setLike(liked);
      setLikeCount(likeCount);

      setPost((prev) => ({
        ...prev,
        like: liked,
        boardLikeCount: likeCount,
      }));
    } catch (error) {
      console.error("추천 에러 : ", error);
      alert("추천 처리 중 오류가 발생했습니다.");
    }
  };

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

      <article
        className="h-[30rem] prose prose-img:rounded-lg prose-img:shadow text-gray-900 max-w-none text-lg mb-8 overflow-auto whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

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

      {/* 버튼 그룹 */}
      <div className="flex justify-between items-center mb-8">
        {/* 왼쪽: 목록 */}
        <button onClick={goList} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          목록
        </button>

        {/* 중앙: 추천 (로그인한 사용자만) */}
        {currentUser && (
          <button
            onClick={boardLike}
            className={clsx(
              "w-24 h-24 flex flex-col items-center justify-center rounded-full font-semibold text-sm text-center transition whitespace-nowrap",
              like ? "bg-pink-500 text-white hover:bg-pink-600" : "bg-gray-300 text-gray-800 hover:bg-gray-400"
            )}
          >
            <span>{like ? "추천 취소❤️" : "추천하기 👍"}</span>
            <span className="text-xl font-bold mt-1">{likeCount}</span>
          </button>
        )}

        {/* 오른쪽: 수정/삭제 (작성자 본인 or 관리자) */}
        {currentUser && (currentUser.id === post.memberid || currentUser.role === "ADMIN") && (
          <div className="flex gap-2">
            <button onClick={goUpdate} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
              수정
            </button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              삭제
            </button>
          </div>
        )}
      </div>

      <ReplyList bno={post.bno} />
    </div>
  );
};

export default BoardDetail;
