import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const ReplyForm = ({ bno, parentRno = null, onSubmit }) => {
  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return alert("댓글 내용을 입력해주세요.");

    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      const res = await fetch("/api/replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bno, text: trimmed, parentRno }),
      });

      if (!res.ok) {
        alert("댓글 등록 실패");
        return;
      }

      setContent("");
      onSubmit(); // 댓글 목록 갱신
    } catch (err) {
      alert("서버 오류");
      console.error(err);
    }
  };

  const showButton = focused || content.length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="댓글을 입력하세요"
          className="w-full resize-none rounded-xl border border-zinc-300 p-3 bg-white shadow pr-24 focus:outline-none"
          rows={1}
        />
        {showButton && (
          <Button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm px-4 py-2 h-9"
            variant="outline"
          >
            등록
          </Button>
        )}
      </div>
    </form>
  );
};

export default ReplyForm;
