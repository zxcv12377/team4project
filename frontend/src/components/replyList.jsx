import React, { useState, useEffect, useCallback } from "react";
import ReplyItem from "./replyItem";
import ReplyForm from "./replyForm";

const ReplyList = ({ bno }) => {
  const [replies, setReplies] = useState([]);

  const fetchReplies = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/replies?bno=${bno}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("댓글 응답 형식 오류");

      setReplies(data);
    } catch (err) {
      console.error("댓글 불러오기 실패", err);
      setReplies([]);
    }
  }, [bno]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const countReplies = (list) => list.reduce((acc, r) => acc + 1 + (r.children ? countReplies(r.children) : 0), 0);

  return (
    <div className="w-full p-4 bg-white rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-3">댓글 {countReplies(replies)}개</h3>
      <ReplyForm bno={bno} onSubmit={fetchReplies} />
      <div className="mt-4 space-y-4">
        {replies.map((reply) => (
          <ReplyItem key={reply.rno} reply={reply} bno={bno} refresh={fetchReplies} />
        ))}
      </div>
    </div>
  );
};

export default ReplyList;
