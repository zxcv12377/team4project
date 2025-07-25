import React, { useState } from "react";
import ReplyForm from "./replyForm";
import axiosInstance from "../lib/axiosInstance";

export default function ReplyItem({ reply, bno, refresh, depth = 0 }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(reply.text);

  const handleDelete = async () => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await axiosInstance.delete(`/replies/${reply.rno}`);
      refresh();
    } catch (err) {
      alert("서버 오류", err);
    }
  };

  const handleEditSubmit = async () => {
    try {
      await axiosInstance.put(`/replies/${reply.rno}`, { text: editedText });

      setEditing(false);
      refresh();
    } catch (err) {
      alert("서버 오류", err);
    }
  };

  return (
    <div className={`mb-6 ${depth ? "border-l-2 border-gray-200 pl-4" : ""}`} style={{ marginLeft: depth * 8 }}>
      {editing ? (
        <>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
          <div className="flex gap-2 mt-2 text-xs">
            <button onClick={handleEditSubmit} className="px-3 py-1 bg-indigo-500 text-white rounded">
              저장
            </button>
            <button onClick={() => setEditing(false)} className="px-3 py-1 border rounded">
              취소
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-800">{reply.nickname}</span>
              {reply.badge && (
                <span
                  className={`ml-1 text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                    reply.badge === "관리자" ? "bg-red-500" : "bg-blue-500"
                  } text-white`}
                >
                  {reply.badge}
                </span>
              )}
            </div>
            <time className="text-xs">{new Date(reply.createdDate).toLocaleString()}</time>
          </div>
          <div className="mt-1 text-gray-800" dangerouslySetInnerHTML={{ __html: reply.text }} />
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-indigo-500 hover:underline"
            >
              답글 달기
            </button>

            {!editing && (
              <div className="flex gap-2 text-xs mt-2">
                {/* ✅ 항상 표시됨 */}
                <button onClick={() => setEditing(true)} className="text-green-600 hover:underline">
                  수정
                </button>
                <button onClick={handleDelete} className="text-red-600 hover:underline">
                  삭제
                </button>
              </div>
            )}
          </div>

          {showReplyForm && (
            <ReplyForm
              bno={bno}
              parentRno={reply.rno}
              onSubmit={() => {
                refresh();
                setShowReplyForm(false);
              }}
            />
          )}

          {reply.children &&
            reply.children.map((child) => (
              <ReplyItem key={child.rno} reply={child} bno={bno} refresh={refresh} depth={depth + 1} />
            ))}
        </>
      )}
    </div>
  );
}
