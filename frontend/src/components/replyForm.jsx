import React, { useState } from "react";

const ReplyForm = ({ bno, parentRno = null, onSubmit }) => {
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      alert("댓글 내용을 입력하세요.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 댓글을 작성할 수 있습니다.");
      return;
    }

    try {
      const response = await fetch("/api/replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bno,
          text: content,
          parentRno,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(`댓글 등록 실패: ${response.status}`);
        console.log(error);
        return;
      }

      setContent("");
      onSubmit();
    } catch (err) {
      console.log(err);
      alert("서버 오류로 댓글을 등록할 수 없습니다.");
    }
  };

  const showButton = isFocused || content.length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full gap-2">
      <div className="relative w-full">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          placeholder="댓글을 입력하세요"
          className="w-full resize-none min-h-[48px]
          rounded-2xl border border-zinc-300 p-4 bg-white 
          shadow focus:outline-none pr-28 transition"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={1}
        />
        {showButton && (
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2
              rounded-xl border border-zinc-300 bg-zinc-50 text-zinc-500
              hover:bg-zinc-100 hover:text-zinc-900 h-9 px-5 py-2 text-sm transition"
          >
            등록
          </button>
        )}
      </div>
      <div className="border-b-2 border-zinc-200 mt-2" />
      <div className="flex justify-start font-semibold text-sm text-blue-400">
        댓글 목록
      </div>
      <div className="border-b-2 border-zinc-200 mt-1" />
    </form>
  );
};

export default ReplyForm;
