import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReplyItem from "./replyItem";
import ReplyForm from "./replyForm";
import axiosInstance from "../lib/axiosInstance";

function countReplies(list) {
  return list.reduce((sum, reply) => sum + 1 + countReplies(reply.children || []), 0);
}

export default function ReplyList({ bno }) {
  const [bestReplies, setBestReplies] = useState([]);
  const [generalReplies, setGeneralReplies] = useState([]);

  // 댓글 개수만 계산 → 의존성 변경 시에만 다시 계산
  const totalCount = useMemo(
    () => countReplies(bestReplies) + countReplies(generalReplies),
    [bestReplies, generalReplies]
  );

  // 댓글 불러오기
  const fetchReplies = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/replies/board/${bno}?sort=best`);
      const { bestReplies = [], replies = [] } = res.data;
      setBestReplies(bestReplies);
      setGeneralReplies(replies);
    } catch (err) {
      console.error("댓글 불러오기 실패", err);
    }
  }, [bno]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  // ReplyItem 만 렌더
  const renderReply = (reply) => <ReplyItem key={reply.rno} reply={reply} bno={bno} refresh={fetchReplies} />;

  return (
    <section className="w-full max-w-6xl mx-auto bg-gray-50">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b-4 border-red-400 pb-4">댓글 {totalCount}개</h3>
      <div className="mt-8 space-y-6">
        {bestReplies.map((r) => (
          <div key={r.rno} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-yellow-600 text-sm font-semibold mb-1">🏆 BEST</div>
            {renderReply(r)}
          </div>
        ))}
        {generalReplies.map((r) => renderReply(r))}
      </div>
      <ReplyForm bno={bno} onSubmit={fetchReplies} />
    </section>
  );
}
