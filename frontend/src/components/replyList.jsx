import React, { useState, useEffect, useCallback } from "react";
import ReplyItem from "./replyItem";
import ReplyForm from "./replyForm";

export default function ReplyList({ bno }) {
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
      if (!data || !Array.isArray(data.best)) throw new Error("형식 오류");

      setBestReplies(data.best);
      setGeneralReplies(data.general);

      const liked = localStorage.getItem("likedReplies");
      setLikedReplies(new Set(liked ? JSON.parse(liked) : []));
    } catch (err) {
      setBestReplies([]);
      setGeneralReplies([]);
      console.error("댓글 불러오기 실패", err);
    }
  }, [bno]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const handleLike = async (rno) => {
    if (likedReplies.has(rno)) return;
    const nickname = localStorage.getItem("username");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/replies/${rno}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nickname }),
      });
      if (res.ok) {
        const updated = new Set(likedReplies);
        updated.add(rno);
        setLikedReplies(updated);
        localStorage.setItem("likedReplies", JSON.stringify([...updated]));
        fetchReplies();
      } else {
        alert("추천 실패");
      }
    } catch (err) {
      console.error("추천 실패", err);
    }
  };

  const renderReply = (reply) => (
    <div>
      <ReplyItem reply={reply} bno={bno} refresh={fetchReplies} />
      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
        <span className="text-orange-500 font-semibold">👍 추천 {reply.likeCount}</span>
        <button
          onClick={() => handleLike(reply.rno)}
          disabled={likedReplies.has(reply.rno)}
          className={`px-3 py-1 text-xs rounded border transition ${
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
    <section className="w-full max-w-3xl mx-auto bg-white border rounded-2xl shadow p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">댓글 {bestReplies.length + generalReplies.length}개</h3>
      <ReplyForm bno={bno} onSubmit={fetchReplies} />
      <div className="mt-8 space-y-6">
        {bestReplies.map((r) => (
          <div key={r.rno} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-yellow-600 text-sm font-semibold mb-1">🏆 BEST</div>
            {renderReply(r)}
          </div>
        ))}
        {generalReplies.map((r) => (
          <div key={r.rno}>{renderReply(r)}</div>
        ))}
      </div>
    </section>
  );
}
