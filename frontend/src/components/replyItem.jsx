import React, { useState } from "react";
import ReplyForm from "./replyForm";

const ReplyItem = ({ reply, bno, refresh, depth = 0 }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(reply.text);
  const currentUser = localStorage.getItem("username");

  const handleDelete = async () => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/replies/${reply.rno}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        refresh();
      } else {
        alert("삭제 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  const handleEditSubmit = async () => {
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

      if (res.ok) {
        setEditing(false);
        refresh();
      } else {
        alert("수정 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  return (
    <div className={`mb-4 ${depth > 0 ? "border-l-2 pl-4" : ""}`} style={{ marginLeft: depth * 8 }}>
      {editing ? (
        <div className="space-y-1">
          <textarea
            className="w-full p-2 border border-gray-600 rounded-md text-sm bg-[#1e293b] text-white"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
          <div className="flex justify-between mt-2">
            <button onClick={handleEditSubmit} className="text-xs text-indigo-500 hover:underline">
              저장
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:underline">
              취소
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-white">{reply.nickname}</span>
              {reply.badge && (
                <span
                  className={`ml-1 text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                    reply.badge === "관리자" ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                  }`}
                >
                  {reply.badge}
                </span>
              )}
            </div>
            <span className="text-xs">{new Date(reply.createdDate).toLocaleString()}</span>
          </div>
          <p className="text-white">{reply.text}</p>
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <button onClick={() => setShowReplyForm(!showReplyForm)} className="text-xs text-indigo-500 hover:underline">
          답글 달기
        </button>
        {reply.nickname === currentUser && !editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="text-xs text-green-600 hover:underline">
              수정
            </button>
            <button onClick={handleDelete} className="text-xs text-red-600 hover:underline">
              삭제
            </button>
          </div>
        )}
      </div>

      {showReplyForm && <ReplyForm bno={bno} parentRno={reply.rno} onSubmit={refresh} />}
    </div>
  );
};

export default ReplyItem;
