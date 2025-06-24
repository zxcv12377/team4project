import React, { useState, useRef } from "react";

const emojis = ["😀", "😂", "😍", "🔥", "😢", "👍", "👎", "💯"];

export default function ReplyForm({ bno, parentRno = null, onSubmit }) {
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef();

  const token = localStorage.getItem("token");
  const showButton = isFocused || content.length > 0;

  // 🔒 로그인하지 않은 사용자 → 입력창 대신 안내 메시지
  if (!token) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-md w-full max-w-3xl mx-auto p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">댓글 작성</h3>
        <p className="text-gray-600">
          <span className="text-red-500 font-semibold">로그인</span> 후 댓글을 작성할 수 있습니다.
        </p>
        <a href="/login" className="inline-block mt-4 px-4 py-2 text-sm bg-red-400 text-white rounded hover:bg-red-500">
          로그인하러 가기
        </a>
      </div>
    );
  }

  // ✅ 로그인한 사용자만 아래 댓글 폼 렌더링
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return alert("댓글 내용을 입력하세요.");

    try {
      const response = await fetch("/api/replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bno, text: content, parentRno }),
      });

      if (!response.ok) return alert(`댓글 등록 실패: ${response.status}`);
      setContent("");
      onSubmit();
    } catch (err) {
      console.error(err);
      alert("서버 오류로 댓글을 등록할 수 없습니다.");
    }
  };

  const insertAtCursor = (text) => {
    const textarea = document.querySelector("textarea");
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = content.slice(0, start) + text + content.slice(end);
    setContent(newText);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/uploads/images", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const imageUrl = data.url;
      insertAtCursor(`![image](${imageUrl})`);
    } catch (err) {
      console.error(err);
      alert("이미지 업로드 실패");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-2xl shadow-md w-full max-w-3xl mx-auto p-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">댓글 작성</h3>

      <div className="relative mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full min-h-[90px] resize-none rounded-lg border border-gray-300 p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
        />
        {showButton && (
          <button
            type="submit"
            className="absolute right-4 top-3 px-4 py-1.5 rounded-lg bg-indigo-500 text-sm text-white hover:bg-indigo-600 transition"
          >
            등록
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xl">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => insertAtCursor(emoji)}
            className="hover:scale-110 transition"
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="ml-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
        >
          📷 이미지 첨부
        </button>
        <input type="file" accept="image/*" ref={fileInputRef} hidden onChange={handleImageUpload} />
      </div>
    </form>
  );
}
