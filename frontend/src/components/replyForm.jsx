import React, { useState, useRef } from "react";
import axiosInstance from "../lib/axiosInstance";
import BoardList from "./boardList";

const emojis = ["😀", "😂", "😍", "🔥", "😢", "👍", "👎", "💯"];

export default function ReplyForm({ bno, parentRno = null, onSubmit }) {
  const [emoticonOpen, setEmoticonOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [veryConOpen, setVeryConOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(); // 커서 위치 추적용 ref

  const token = localStorage.getItem("token");
  // const showButton = isFocused || content.length > 0;

  // 🔒 로그인하지 않은 사용자 → 입력창 대신 안내 메시지
  if (!token) {
    return (
      // border border-gray-200 rounded-2xl shadow-md
      <div className="bg-white w-full max-w-3xl mx-auto p-6 text-center">
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
      await axiosInstance.post("/replies", {
        bno,
        text: content.trim(),
        parentRno: parentRno ?? null,
      });

      setContent("");
      onSubmit();
    } catch (err) {
      console.error(err);
      alert("서버 오류로 댓글을 등록할 수 없습니다.");
    }
  };

  // 이모지 삽입
  const insertAtCursor = (text) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);
    setContent(before + text + after);
    // 커서 위치 복원
    setTimeout(() => {
      ta.focus();
      const newPos = start + text.length;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-6xl mx-auto p-6 border-t-2 border-red-400 border-b-2"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">댓글 작성</h3>

        <div className="relative mb-4">
          <textarea
            ref={textareaRef} // ref 연결
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full min-h-[90px] resize-none rounded-lg border border-gray-300 p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
          />
          {/* {showButton && (
          )} */}
        </div>

        <div className="relative inline-block w-full">
          <button
            type="button"
            onClick={() => {
              setEmoticonOpen((v) => !v);
              setEmojiOpen(true);
            }}
            className="ml-1 px-3 py-1 text-sm border rounded-md"
          >
            📷 이모티콘
          </button>
          <button
            type="submit"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 px-4 py-1.5 rounded-lg bg-indigo-500 text-sm text-white hover:bg-indigo-600 transition"
          >
            등록
          </button>
          {/* 이모티콘 창 */}
          {emoticonOpen && (
            <div className="mt-2 absolute top-full left-0 w-[40rem] bg-white border rounded-lg shadow-lg z-50 ">
              <div className="bg-gray-300 w-full h-10 flex justify-start">
                <button
                  type="button"
                  className="w-[5rem] hover:bg-gray-400"
                  onClick={() => {
                    setEmojiOpen(true);
                    setVeryConOpen(false);
                  }}
                >
                  이모지
                </button>
                <button
                  type="button"
                  className="w-[5rem] hover:bg-gray-400"
                  onClick={() => {
                    setEmojiOpen(false);
                    setVeryConOpen(true);
                  }}
                >
                  베리콘
                </button>
              </div>
              {emojiOpen && (
                <div>
                  {emojis.map((e) => (
                    <button
                      type="button"
                      key={e}
                      onClick={() => insertAtCursor(e)}
                      className="hover:scale-110 transition text-2xl p-1"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
              {veryConOpen && <div>베리콘</div>}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
