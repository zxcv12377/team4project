import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

const emojis = ["😀", "😂", "😍", "🔥", "😢", "👍", "👎", "💯"];

const ReplyForm = ({ bno, parentRno = null, onSubmit }) => {
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef();

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
        body: JSON.stringify({ bno, text: content, parentRno }),
      });

      if (!response.ok) {
        alert(`댓글 등록 실패: ${response.status}`);
        return;
      }

      setContent("");
      onSubmit();
    } catch (err) {
      console.log(err);
      alert("서버 오류로 댓글을 등록할 수 없습니다.");
    }
  };

  const insertAtCursor = (text) => {
    const textarea = document.querySelector("textarea");
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = content.substring(0, start) + text + content.substring(end);
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

  const showButton = isFocused || content.length > 0;

  return (
    <form onSubmit={handleSubmit} className="bg-[#1e293b] p-6 rounded-xl w-full max-w-md mx-auto">
      <h3 className="text-2xl font-semibold text-white mb-4">댓글 작성</h3>
      <div className="relative w-full mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요"
          className="w-full resize-none min-h-[80px] rounded-md border border-gray-600 p-4 bg-[#1e293b] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {showButton && (
          <button
            type="submit"
            className="absolute right-3 top-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 p-2"
          >
            등록
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-xl mb-2">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="hover:scale-110 transition"
            onClick={() => insertAtCursor(emoji)}
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="text-sm px-3 py-1 border rounded-md hover:bg-indigo-100"
        >
          📷 이미지 첨부
        </button>
        <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />
      </div>
    </form>
  );
};

export default ReplyForm;
