import React, { useState } from "react";
import ReplyForm from "./replyForm";

const ReplyItem = ({ reply, bno, refresh, depth = 0 }) => {
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(reply.text);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const currentUser = localStorage.getItem("username");

  const handleDelete = async () => {
    if (!confirm("댓글을 삭제할까요?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/replies/${reply.rno}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return alert("삭제 실패");
      refresh();
    } catch (err) {
      alert("서버 오류");
      console.error(err);
    }
  };

  const handleEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/replies/${reply.rno}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: editedText }),
      });

      if (!res.ok) return alert("수정 실패");
      setEditing(false);
      refresh();
    } catch (err) {
      alert("서버 오류");
      console.error(err);
    }
  };

  return (
    <div className={`pl-${Math.min(depth * 4, 12)} border-l-2 border-zinc-200 mb-4`}>
      {editing ? (
        <div>
          <textarea
            className="w-full p-2 border text-sm"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-1">
            <button className="text-blue-600 text-xs" onClick={handleEdit}>
              저장
            </button>
            <button className="text-gray-500 text-xs" onClick={() => setEditing(false)}>
              취소
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm text-zinc-500 flex justify-between">
            <span>{reply.replyer}</span>
            <span>{new Date(reply.createdDate).toLocaleString()}</span>
          </div>
          <p className="text-zinc-800">{reply.text}</p>
        </>
      )}

      <div className="flex justify-between mt-1 text-xs">
        <button onClick={() => setShowReplyForm(!showReplyForm)} className="text-blue-500 hover:underline">
          답글
        </button>
        {currentUser === reply.username && !editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="text-green-500 hover:underline">
              수정
            </button>
            <button onClick={handleDelete} className="text-red-500 hover:underline">
              삭제
            </button>
          </div>
        )}
      </div>

      {showReplyForm && (
        <div className="mt-2">
          <ReplyForm bno={bno} parentRno={reply.rno} onSubmit={refresh} />
        </div>
      )}

      {/* 재귀 렌더링 */}
      {reply.children?.map((child) => (
        <ReplyItem key={child.rno} reply={child} bno={bno} refresh={refresh} depth={depth + 1} />
      ))}
    </div>
  );
};

export default ReplyItem;
