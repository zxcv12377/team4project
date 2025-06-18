import React, { useState, useEffect, useCallback } from "react";
import ReplyItem from "./replyItem";
import ReplyForm from "./replyForm";

const ReplyList = ({ bno }) => {
  const [bestReplies, setBestReplies] = useState([]);
  const [generalReplies, setGeneralReplies] = useState([]);
  const [likedReplies, setLikedReplies] = useState(new Set());

  const fetchReplies = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/replies/board/${bno}?sort=best`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!data || !Array.isArray(data.best) || !Array.isArray(data.general)) {
        throw new Error("댓글 응답 형식 오류");
      }

      setBestReplies(data.best);
      setGeneralReplies(data.general);

      // 좋아요한 댓글 목록을 로컬스토리지에서 불러옴
      const liked = localStorage.getItem("likedReplies");
      setLikedReplies(new Set(liked ? JSON.parse(liked) : []));
    } catch (err) {
      console.error("댓글 불러오기 실패", err);
      setBestReplies([]);
      setGeneralReplies([]);
    }
  }, [bno]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const countReplies = (list) =>
    list.reduce(
      (acc, r) => acc + 1 + (r.children ? countReplies(r.children) : 0),
      0
    );

  const totalCount = countReplies([...bestReplies, ...generalReplies]);

  const handleLike = async (rno) => {
    const nickname = localStorage.getItem("username");
    if (likedReplies.has(rno)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/replies/${rno}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname }),
      });
      if (res.ok) {
        const updated = new Set(likedReplies);
        updated.add(rno);
        setLikedReplies(updated);
        localStorage.setItem("likedReplies", JSON.stringify([...updated]));
        fetchReplies();
      } else {
        alert("이미 추천했거나 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("추천 실패", err);
    }
  };

  const renderReply = (reply) => (
    <div>
      <ReplyItem reply={reply} bno={bno} refresh={fetchReplies} />
      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
        <span className="text-orange-500 font-semibold">
          👍 추천 {reply.likeCount}
        </span>
        <button
          onClick={() => handleLike(reply.rno)}
          disabled={likedReplies.has(reply.rno)}
          className={`px-2 py-1 text-xs border rounded transition duration-150 ${
            likedReplies.has(reply.rno)
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "border-gray-300 hover:bg-orange-100 hover:border-orange-400 hover:text-orange-600"
          }`}
        >
          {likedReplies.has(reply.rno) ? "추천 완료" : "추천하기"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full p-4 bg-white rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-3">댓글 {totalCount}개</h3>

      {/* 댓글 입력창 */}
      <ReplyForm bno={bno} onSubmit={fetchReplies} />

      {/* 댓글 목록 (베스트 + 일반 통합) */}
      <div className="mt-6 space-y-4">
        {bestReplies.map((reply) => (
          <div
            key={reply.rno}
            className="bg-yellow-50 rounded-lg p-2 border border-yellow-300"
          >
            <div className="flex items-center gap-2 text-yellow-600 font-semibold text-sm mb-1">
              <span>🏆</span>
              <span>BEST</span>
            </div>
            {renderReply(reply)}
          </div>
        ))}
        {generalReplies.map((reply) => (
          <div key={reply.rno}>{renderReply(reply)}</div>
        ))}
      </div>
    </div>
  );
};

export default ReplyList;
