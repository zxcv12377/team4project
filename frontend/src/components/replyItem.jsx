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
    <div
      className={
        depth === 0
          ? "mb-2"
          : "border-l-2 border-zinc-200 ml-2 pl-2 mb-2 bg-transparent"
      }
      style={{
        marginLeft: depth === 0 ? 0 : `${Math.min(depth * 8, 24)}px`,
      }}
    >
      {editing ? (
        <div className="space-y-1">
          <textarea
            className="w-full p-1 border text-sm"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
          <div className="flex items-center justify-between mt-1">
            <div />
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditSubmit}
                className="text-xs text-blue-600 hover:underline"
              >
                저장
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-gray-500 hover:underline"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center text-sm text-zinc-500 mb-1">
            <span>{reply.replyer}</span>
            <span>{new Date(reply.createdDate).toLocaleString()}</span>
          </div>
          <p className="text-zinc-800">{reply.text}</p>
        </>
      )}

      <div className="flex items-center justify-between mt-1">
        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="text-xs text-blue-500 hover:underline"
        >
          답글 달기
        </button>
        <div className="flex items-center gap-2">
          {reply.username === currentUser && !editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-green-600 hover:underline"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-red-600 hover:underline"
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      <div className="border-b-2 border-zinc-200 mt-2" />

      {showReplyForm && (
        <div
          className={`mt-2 ${
            depth > 0 ? "border-none bg-transparent p-0" : ""
          }`}
        >
          <ReplyForm bno={bno} parentRno={reply.rno} onSubmit={refresh} />
        </div>
      )}

      <div className="mt-2 space-y-2">
        {reply.children?.map((child) => (
          <ReplyItem
            key={child.rno}
            reply={child}
            bno={bno}
            refresh={refresh}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );
};

export default ReplyItem;
