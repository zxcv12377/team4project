import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserContext } from "@/context/UserContext";
import ImageUploader from "@/components/ImageUploader"; // ✅ 추가
import axiosInstance from "../lib/axiosInstance";

export default function BoardCreate() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [attachments, setAttachments] = useState([]); // 🔥 ImageDTO 배열 저장

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  // 💡 개별 이미지 삭제
  const handleRemoveImage = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 💡 전체 이미지 삭제
  const handleClearImages = () => {
    setAttachments([]);
  };

  //  게시글 등록
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      const body = {
        title,
        content,
        attachments: attachments, // 그대로 보내면 됨 (List<ImageDTO>)
      };

      await axiosInstance.post("/boards/", body);

      alert("게시글이 등록되었습니다.");
      navigate("/boards");
    } catch (error) {
      console.error("게시글 등록 실패:", error);
      alert("게시글 등록에 실패했습니다.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-24 p-6 rounded-lg">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">📝 게시글 작성</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-700 font-medium">제목</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 font-medium">내용</label>
          <textarea
            className="w-full h-40 px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring focus:ring-blue-200"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
          />
        </div>
        {/* ✅ 이미지 업로드 영역 */}
        <div>
          <label className="block mb-1 text-gray-700 font-medium">이미지 첨부</label>
          <ImageUploader onImagesUploaded={(images) => setAttachments((prev) => [...prev, ...images])} />

          {/* ✅ 이미지 미리보기 + 삭제 버튼 */}
          {attachments.length > 0 && (
            <>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {attachments.map((img, idx) => {
                  const src = img.thumbnailUrl || img.originalUrl || "";
                  const finalSrc = src.startsWith("https") ? src : `${baseURL}${src}`;

                  return (
                    <div key={idx} className="relative group">
                      <img src={finalSrc} alt={`첨부 이미지 ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)} // 💡 삭제 핸들러
                        className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded opacity-80 hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 💡 전체 삭제 버튼 */}
              <button type="button" onClick={handleClearImages} className="mt-2 text-sm text-red-500 underline">
                전체 이미지 삭제
              </button>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            취소
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            등록
          </button>
        </div>
      </form>
    </div>
  );
}
