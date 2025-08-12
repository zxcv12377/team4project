import React, { useState, useRef, useMemo, useEffect } from "react";
import axiosInstance from "../lib/axiosInstance";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import SlidePopup from "./slidePopup";
import LoginForm from "./loginForm";
import RegisterForm from "./registerForm";

const emojis = ["😀", "😂", "😍", "🔥", "😢", "👍", "👎", "💯"];

export default function ReplyForm({ bno, parentRno = null, onSubmit }) {
  const [emoticonOpen, setEmoticonOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [veryConOpen, setVeryConOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [content, setContent] = useState(""); // 순수 텍스트만
  const [selectedEmote, setSelectedEmote] = useState(null); // {type:'image'|'emoji', alt?, url?, text?}

  const [verrycons, setVerrycons] = useState([]); // [{ id, imagePath, categoryName, ... }]
  const [loadingVerrycon, setLoadingVerrycon] = useState(false);
  const [verryconError, setVerryconError] = useState(null);
  const navigate = useNavigate();

  // 탭 상태
  const [activeCat, setActiveCat] = useState("전체");

  const textareaRef = useRef();

  // ===== 서버에서 베리콘 로딩 (오버레이 열릴 때 한 번만) =====
  const fetchVerrycons = async () => {
    if (loadingVerrycon || verrycons.length) return;
    setLoadingVerrycon(true);
    setVerryconError(null);
    try {
      const res = await axiosInstance.get("/verrycons");
      setVerrycons(res.data || []);
    } catch (err) {
      console.error("베리콘 로딩 실패:", err);
      setVerryconError("베리콘을 불러오지 못했습니다.");
    } finally {
      setLoadingVerrycon(false);
    }
  };

  // 카테고리 목록 만들기
  const categories = useMemo(() => {
    const set = new Set(verrycons.map((v) => v.categoryName || "미분류"));
    return ["전체", ...Array.from(set)];
  }, [verrycons]);

  // 선택된 카테고리의 아이템
  const filteredVerrycons = useMemo(() => {
    if (activeCat === "전체") return verrycons;
    return verrycons.filter((v) => (v.categoryName || "미분류") === activeCat);
  }, [verrycons, activeCat]);

  // 이모지/베리콘 선택 (항상 1개만 유지, 새로 클릭하면 교체)
  const selectEmoji = (ch) => setSelectedEmote({ type: "emoji", text: ch });
  const selectVerrycon = (item) =>
    setSelectedEmote({ type: "image", alt: item.categoryName ?? "베리콘", url: item.imagePath });
  const clearEmote = () => setSelectedEmote(null);

  // 미리보기 전용 (베리콘만)
  const previewOnlyEmote = selectedEmote
    ? selectedEmote.type === "image"
      ? `![${selectedEmote.alt ?? ""}](${selectedEmote.url})`
      : `${selectedEmote.text}`
    : "";

  // 서버 전송용 (베리콘 + 빈줄 + 텍스트)
  const submitMarkdown =
    (selectedEmote
      ? selectedEmote.type === "image"
        ? `![${selectedEmote.alt ?? ""}](${selectedEmote.url})`
        : `${selectedEmote.text}`
      : "") + (content.trim() ? `${selectedEmote ? "\n\n" : ""}${content.trim()}` : "");

  // 등록
  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalText = submitMarkdown.trim();
    if (!finalText) {
      alert("내용이 없습니다. 베리콘을 선택하거나 텍스트를 입력하세요.");
      return;
    }
    try {
      await axiosInstance.post("/replies", {
        bno,
        text: finalText, // 베리콘(위) + 빈줄 + 텍스트(아래)
        parentRno: parentRno ?? null,
      });
      setContent("");
      setSelectedEmote(null);
      onSubmit?.();
    } catch (err) {
      console.error(err);
      alert("서버 오류로 댓글을 등록할 수 없습니다.");
    }
  };

  // 로그인 가드
  const token = localStorage.getItem("token");
  if (!token) {
    return (
      <div className="bg-white w-full max-w-3xl mx-auto p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">댓글 작성</h3>
        <p className="text-gray-600">
          <span className="text-red-500 font-semibold">로그인</span> 후 댓글을 작성할 수 있습니다.
        </p>
        <button
          className="inline-block mt-4 px-4 py-2 text-sm bg-red-400 text-white rounded hover:bg-red-500"
          onClick={() => {
            setShowLogin(true);
            console.log(showLogin);
          }}
        >
          로그인하러 가기
        </button>
        <SlidePopup show={showLogin} onClose={() => setShowLogin(false)}>
          <LoginForm
            onSwitchToRegister={() => {
              setShowLogin(false);
              setShowRegister(true);
            }}
          />
        </SlidePopup>
        <SlidePopup show={showRegister} onClose={() => setShowRegister(false)}>
          <RegisterForm
            onSwitchToLogin={() => {
              setShowRegister(false);
              setShowLogin(true);
            }}
          />
        </SlidePopup>
      </div>
    );
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-6xl mx-auto p-6 border-t-2 border-red-400 border-b-2"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">댓글 작성</h3>

        {/* ⬆️ 미리보기: 베리콘(있으면) + 텍스트 */}
        {previewOnlyEmote && (
          <div className="mt-2 mb-4 p-3 border rounded bg-gray-50">
            <div className="text-sm text-gray-500 mb-2">
              미리보기
              {selectedEmote && (
                <button type="button" onClick={clearEmote} className="ml-2 text-xs text-red-500 underline">
                  베리콘 제거
                </button>
              )}
            </div>
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewOnlyEmote}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* ✍️ 텍스트 입력창: 순수 텍스트만 */}
        <div className="relative mb-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="텍스트를 입력하세요"
            className="w-full min-h-[90px] resize-none rounded-lg border border-gray-300 p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
          />
        </div>

        {/* 😊 이모티콘/베리콘 선택 + 등록 */}
        <div className="relative inline-block w-full">
          <button
            type="button"
            onClick={() => {
              const next = !emoticonOpen;
              setEmoticonOpen(next);
              if (next) {
                // 열릴 때 기본 탭은 '이모지'
                setEmojiOpen(true);
                setVeryConOpen(false);
                fetchVerrycons();
              }
            }}
            className="ml-1 px-3 py-1 text-sm border rounded-md"
          >
            😊 이모티콘
          </button>

          <button
            type="submit"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 px-4 py-1.5 rounded-lg bg-indigo-500 text-sm text-white hover:bg-indigo-600 transition"
          >
            등록
          </button>

          {emoticonOpen && (
            <div className="mt-2 absolute top-full left-0 w-[44rem] bg-white border rounded-lg shadow-lg z-50">
              {/* 1) 1차 탭: 이모지 / 베리콘 */}
              <div className="flex w-full gap-2 border-b bg-gray-50 px-2 py-2">
                <button
                  type="button"
                  className={`px-3 py-1 rounded ${emojiOpen ? "bg-white border" : "hover:bg-gray-100"}`}
                  onClick={() => {
                    setEmojiOpen(true);
                    setVeryConOpen(false);
                  }}
                >
                  이모지
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded ${veryConOpen ? "bg-white border" : "hover:bg-gray-100"}`}
                  onClick={() => {
                    setEmojiOpen(false);
                    setVeryConOpen(true);
                    fetchVerrycons();
                  }}
                >
                  베리콘
                </button>
              </div>

              {/* 2) 이모지 콘텐츠 */}
              {emojiOpen && (
                <div className="p-2">
                  {emojis.map((e) => (
                    <button
                      type="button"
                      key={e}
                      onClick={() => selectEmoji(e)}
                      className={`hover:scale-110 transition text-2xl p-1 ${
                        selectedEmote?.text === e ? "ring-2 ring-indigo-400 rounded" : ""
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}

              {/* 3) 베리콘 콘텐츠 (카테고리 탭 + 그리드) */}
              {veryConOpen && (
                <div className="p-2">
                  {/* 3-1) 카테고리 탭바 */}
                  <div className="flex items-center gap-2 border-b pb-2 mb-2 overflow-x-auto">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCat(cat)}
                        className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                          activeCat === cat ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* 3-2) 상태 */}
                  {loadingVerrycon && <div className="p-3 text-sm text-gray-500">로딩 중...</div>}
                  {verryconError && <div className="p-3 text-sm text-red-500">{verryconError}</div>}

                  {/* 3-3) 그리드 */}
                  {!loadingVerrycon && !verryconError && (
                    <div className="grid grid-cols-5 gap-4">
                      {filteredVerrycons.map((item) => {
                        const active = selectedEmote?.type === "image" && selectedEmote?.url === item.imagePath;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectVerrycon(item)} // textarea에 넣지 않고 상태만 교체
                            className={`flex justify-center items-center p-2 border rounded hover:bg-gray-50 ${
                              active ? "ring-2 ring-indigo-400" : ""
                            }`}
                            title={item.categoryName}
                          >
                            <img
                              src={item.imagePath}
                              alt={item.categoryName}
                              className="max-w-20 max-h-20 object-contain"
                              loading="lazy"
                            />
                          </button>
                        );
                      })}
                      {filteredVerrycons.length === 0 && (
                        <div className="col-span-5 p-4 text-center text-sm text-gray-500">
                          해당 카테고리에 베리콘이 없습니다.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
